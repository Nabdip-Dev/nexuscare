const { Notification } = require('../models/index');
const { sendEmail, emailTemplates } = require('./email.service');

const createNotification = async (io, { recipient, type, title, message, data = {}, emailData = null }) => {
  try {
    const notification = await Notification.create({ recipient, type, title, message, data });

    // Emit real-time notification via Socket.IO
    if (io) {
      io.to(`user:${recipient}`).emit('notification', {
        _id: notification._id,
        type, title, message, data,
        createdAt: notification.createdAt
      });
    }

    // Send email if needed
    if (emailData) {
      await sendEmail(emailData);
    }

    return notification;
  } catch (error) {
    console.error('Notification create error:', error.message);
  }
};

const notifyAppointmentBooked = async (io, appointment, patient, doctor) => {
  const dateStr = new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = appointment.timeSlot.startTime;

  // Notify patient
  await createNotification(io, {
    recipient: patient._id,
    type: 'appointment_booked',
    title: 'Appointment Booked',
    message: `Your appointment with Dr. ${doctor.user.name} is confirmed for ${dateStr} at ${timeStr}.`,
    data: { appointmentId: appointment._id },
    emailData: {
      to: patient.email,
      ...emailTemplates.appointmentBooked(patient.name, doctor.user.name, dateStr, timeStr, appointment.tokenNumber)
    }
  });

  // Notify doctor
  await createNotification(io, {
    recipient: doctor.user._id,
    type: 'appointment_booked',
    title: 'New Appointment',
    message: `New appointment from ${patient.name} on ${dateStr} at ${timeStr}.`,
    data: { appointmentId: appointment._id }
  });
};

const notifyPrescriptionReady = async (io, prescription, patient, doctor) => {
  await createNotification(io, {
    recipient: patient._id,
    type: 'prescription_ready',
    title: 'Prescription Ready',
    message: `Dr. ${doctor.user.name} has issued prescription ${prescription.prescriptionNumber}.`,
    data: { prescriptionId: prescription._id },
    emailData: {
      to: patient.email,
      ...emailTemplates.prescriptionReady(patient.name, doctor.user.name, prescription.prescriptionNumber)
    }
  });
};

const notifyAppointmentStatusChange = async (io, appointment, patient, status) => {
  const messages = {
    confirmed: 'Your appointment has been confirmed.',
    cancelled: 'Your appointment has been cancelled.',
    completed: 'Your appointment has been marked as completed.',
    'no-show': 'You were marked as no-show for your appointment.'
  };

  await createNotification(io, {
    recipient: patient._id,
    type: status === 'cancelled' ? 'appointment_cancelled' : 'appointment_confirmed',
    title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: messages[status] || `Appointment status updated to ${status}.`,
    data: { appointmentId: appointment._id }
  });
};

module.exports = { createNotification, notifyAppointmentBooked, notifyPrescriptionReady, notifyAppointmentStatusChange };
