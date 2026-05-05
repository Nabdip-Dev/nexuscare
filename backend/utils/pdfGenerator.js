const PDFDocument = require('pdfkit');
const { cloudinary } = require('../middlewares/upload.middleware');
const { Readable } = require('stream');

const generatePrescriptionPDF = async (prescription, doctor, patient) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      try {
        // Upload to Cloudinary as raw file
        const uploadResult = await new Promise((res, rej) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'nexuscare/prescriptions',
              resource_type: 'raw',
              public_id: `prescription_${prescription.prescriptionNumber}`,
              format: 'pdf'
            },
            (error, result) => {
              if (error) rej(error);
              else res(result);
            }
          );
          const readable = new Readable();
          readable.push(buffer);
          readable.push(null);
          readable.pipe(stream);
        });
        resolve({ url: uploadResult.secure_url, publicId: uploadResult.public_id });
      } catch (err) {
        reject(err);
      }
    });
    doc.on('error', reject);

    // Header
    doc.rect(0, 0, 595, 120).fill('#0ea5e9');
    doc.fillColor('white').fontSize(26).font('Helvetica-Bold').text('NEXUS CARE', 50, 30);
    doc.fontSize(11).font('Helvetica').text('Modern Healthcare Platform', 50, 62);
    doc.fontSize(10).text('Tel: +1 (800) NEXUS-CARE | www.nexuscare.com', 50, 78);
    doc.fontSize(12).text(`Rx #: ${prescription.prescriptionNumber}`, 400, 30, { align: 'right' });
    doc.fontSize(10).text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, 400, 50, { align: 'right' });

    // Doctor info
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text(`Dr. ${doctor.user.name}`, 50, 140);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b');
    if (doctor.specializations?.length) {
      doc.text(doctor.specializations.map(s => s.name).join(', '), 50, 158);
    }
    doc.text(`License: ${doctor.licenseNumber}`, 50, 172);

    // Patient info
    doc.rect(300, 135, 245, 55).fill('#f8fafc').stroke('#e2e8f0');
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('PATIENT', 310, 142);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b');
    doc.text(patient.name, 310, 157);
    doc.text(`DOB: ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}`, 310, 170);
    doc.text(`Gender: ${patient.gender || 'N/A'}`, 420, 170);

    doc.moveTo(50, 200).lineTo(545, 200).strokeColor('#e2e8f0').stroke();

    // Diagnosis
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('DIAGNOSIS', 50, 215);
    doc.fontSize(11).font('Helvetica').fillColor('#334155').text(prescription.diagnosis, 50, 232, { width: 495 });

    let y = 270;

    // Symptoms
    if (prescription.symptoms?.length) {
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('SYMPTOMS', 50, y);
      y += 18;
      doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(prescription.symptoms.join(', '), 50, y, { width: 495 });
      y += 25;
    }

    // Medicines
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('MEDICINES', 50, y);
    y += 18;

    prescription.medicines.forEach((med, i) => {
      if (y > 700) { doc.addPage(); y = 50; }
      const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(50, y - 5, 495, 40).fill(bg);
      doc.fillColor('#0ea5e9').fontSize(11).font('Helvetica-Bold').text(`${i + 1}. ${med.name}`, 60, y);
      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      doc.text(`Dosage: ${med.dosage}`, 60, y + 14);
      doc.text(`Frequency: ${med.frequency}`, 200, y + 14);
      doc.text(`Duration: ${med.duration}`, 350, y + 14);
      if (med.instructions) doc.text(`Instructions: ${med.instructions}`, 60, y + 26);
      y += 48;
    });

    y += 10;

    // Lab Tests
    if (prescription.labTests?.length) {
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('LAB TESTS', 50, y);
      y += 18;
      prescription.labTests.forEach((test, i) => {
        doc.fillColor('#475569').fontSize(10).font('Helvetica').text(`${i + 1}. ${test.testName} (${test.urgency}) ${test.instructions || ''}`, 60, y);
        y += 16;
      });
      y += 10;
    }

    // Notes
    if (prescription.notes) {
      doc.rect(50, y, 495, 1).fill('#e2e8f0');
      y += 10;
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('DOCTOR\'S NOTES', 50, y);
      y += 18;
      doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(prescription.notes, 50, y, { width: 495 });
      y += 30;
    }

    // Follow-up
    if (prescription.followUpDate) {
      doc.rect(50, y, 495, 35).fill('#f0fdf4').stroke('#bbf7d0');
      doc.fillColor('#166534').fontSize(10).font('Helvetica-Bold').text(
        `Follow-up: ${new Date(prescription.followUpDate).toLocaleDateString()}`,
        60, y + 12
      );
      y += 45;
    }

    // Signature line
    const sigY = Math.max(y + 20, 710);
    doc.moveTo(350, sigY).lineTo(545, sigY).strokeColor('#94a3b8').stroke();
    doc.fillColor('#64748b').fontSize(9).text(`Dr. ${doctor.user.name}`, 350, sigY + 5, { width: 195, align: 'center' });
    doc.text('Doctor\'s Signature', 350, sigY + 17, { width: 195, align: 'center' });

    // Footer
    doc.rect(0, 780, 595, 60).fill('#0f172a');
    doc.fillColor('#94a3b8').fontSize(8).text(
      'This prescription is generated electronically and is valid without a physical signature. | Nexus Care © ' + new Date().getFullYear(),
      50, 795, { align: 'center', width: 495 }
    );

    doc.end();
  });
};

module.exports = { generatePrescriptionPDF };
