const Admin = require('../models/Admin');
const Report = require('../models/Report');

// Get admin dashboard data
exports.getDashboard = async (req, res) => {
  try {
    // Recent reports (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentReports = await Report.find({
      createdAt: { $gte: twentyFourHoursAgo }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('reportId category severity status createdAt location');

    // High priority reports
    const highPriorityReports = await Report.find({
      priority: { $gte: 4 },
      status: { $ne: 'resolved' }
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(5)
    .select('reportId category severity priority status createdAt');

    // Statistics
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const reportsAssignedToMe = await Report.countDocuments({ 
      assignedTo: req.user.id 
    });

    // Reports by day for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyReports = await Report.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total: totalReports,
          pending: pendingReports,
          resolved: resolvedReports,
          assignedToMe: reportsAssignedToMe
        },
        recentReports,
        highPriorityReports,
        dailyReports,
        adminInfo: {
          name: req.user.name,
          role: req.user.role,
          department: req.user.department
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all admins (super admin only)
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new admin (super admin only)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role, department, phone, permissions } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin with this email already exists'
      });
    }

    const admin = new Admin({
      name,
      email,
      password,
      role: role || 'admin',
      department,
      phone,
      permissions: permissions || {
        viewReports: true,
        editReports: true,
        deleteReports: false,
        assignReports: false,
        manageAdmins: false
      }
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department
      }
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update admin
exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, role, department, phone, isActive, permissions } = req.body;
    
    // Don't allow updating password through this endpoint
    if (req.body.password) {
      return res.status(400).json({
        success: false,
        error: 'Use change password endpoint to update password'
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        role,
        department,
        phone,
        isActive,
        permissions
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: admin
    });

  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Unassign reports from this admin
    await Report.updateMany(
      { assignedTo: req.params.id },
      { $unset: { assignedTo: '' } }
    );

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};