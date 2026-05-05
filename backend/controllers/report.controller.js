// report.controller.js
const { Report } = require('../models/index');
const { deleteFile } = require('../middlewares/upload.middleware');

exports.uploadReport = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const { title, type, reportDate, notes, appointmentId } = req.body;
    const report = await Report.create({
      patient: req.body.patientId || req.user._id,
      uploadedBy: req.user._id,
      appointment: appointmentId || null,
      title,
      type: type || 'other',
      fileUrl: req.file.path,
      publicId: req.file.filename,
      fileType: req.file.mimetype === 'application/pdf' ? 'pdf' : 'image',
      reportDate: reportDate || new Date(),
      notes
    });
    res.status(201).json({ success: true, message: 'Report uploaded.', data: { report } });
  } catch (error) { next(error); }
};

exports.getMyReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const query = { patient: req.user._id };
    if (type) query.type = type;
    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      Report.find(query).populate('uploadedBy', 'name role').sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      Report.countDocuments(query)
    ]);
    res.json({ success: true, data: { reports, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

exports.getPatientReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ patient: req.params.patientId })
      .populate('uploadedBy', 'name role')
      .sort('-createdAt').lean();
    res.json({ success: true, data: { reports } });
  } catch (error) { next(error); }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (report.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (report.publicId) await deleteFile(report.publicId, report.fileType === 'pdf' ? 'raw' : 'image');
    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted.' });
  } catch (error) { next(error); }
};

module.exports = exports;
