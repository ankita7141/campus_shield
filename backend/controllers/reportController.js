const Report = require('../models/Report');

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const {
      description,
      category,
      severity,
      lat,
      lng,
      address,
      building,
      floor,
      room,
      isAnonymous,
      gender,
      department,
      year,
      contact
    } = req.body;

    // Validate required fields
    if (!description || !lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Description and location coordinates are required'
      });
    }

    // Create report data
    const reportData = {
      description,
      category: category || 'other',
      severity: severity || 'medium',
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: address || 'Location not specified',
        building,
        floor,
        room
      },
      isAnonymous: isAnonymous !== 'false',
      reporterInfo: {
        gender: gender || 'prefer-not-to-say',
        department,
        year,
        contact
      }
    };

    // Handle uploaded files
    if (req.files) {
      reportData.media = {};
      
      if (req.files.images) {
        reportData.media.images = req.files.images.map(file => `/uploads/${file.filename}`);
      }
      
      if (req.files.audio) {
        reportData.media.audio = `/uploads/${req.files.audio[0].filename}`;
      }
    }

    // Determine priority based on severity
    const priorityMap = {
      'low': 1,
      'medium': 2,
      'high': 4,
      'critical': 5
    };
    reportData.priority = priorityMap[reportData.severity] || 3;

    // Create and save report
    const report = new Report(reportData);
    await report.save();

    // Emit socket event for real-time update
    req.app.get('io').emit('new-report', report);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        reportId: report.reportId,
        status: report.status,
        timestamp: report.createdAt
      }
    });

  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all reports
exports.getReports = async (req, res) => {
  try {
    const {
      status,
      category,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    
    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const reports = await Report.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email department');

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      count: reports.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: reports
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single report
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    }).populate('assignedTo', 'name email department');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update report status
exports.updateReport = async (req, res) => {
  try {
    const { status, assignedTo, priority, tags } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (priority) updateData.priority = priority;
    if (tags) updateData.tags = tags;
    
    // If status is being changed to resolved, set resolvedAt
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email department');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Emit socket event
    req.app.get('io').emit('report-updated', report);

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });

  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add follow-up note
exports.addNote = async (req, res) => {
  try {
    const { note, adminId } = req.body;
    
    if (!note) {
      return res.status(400).json({
        success: false,
        error: 'Note is required'
      });
    }

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    report.followUpNotes.push({
      note,
      adminId: adminId || req.user?.id || 'system',
      createdAt: new Date()
    });

    await report.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      data: report.followUpNotes
    });

  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get statistics
exports.getStats = async (req, res) => {
  try {
    const total = await Report.countDocuments();
    const pending = await Report.countDocuments({ status: 'pending' });
    const resolved = await Report.countDocuments({ status: 'resolved' });
    const underReview = await Report.countDocuments({ status: 'under-review' });
    
    // Count by category
    const categoryCount = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Count by severity
    const severityCount = await Report.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        resolved,
        underReview,
        byCategory: categoryCount.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        bySeverity: severityCount.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};