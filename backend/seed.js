require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');
const Doctor = require('./models/Doctor.model');
const { Category } = require('./models/index');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexuscare';

const categories = [
  { name: 'Cardiology', icon: '❤️', description: 'Heart and cardiovascular system specialists' },
  { name: 'Neurology', icon: '🧠', description: 'Brain and nervous system specialists' },
  { name: 'Dermatology', icon: '🧴', description: 'Skin, hair, and nail specialists' },
  { name: 'Orthopedics', icon: '🦴', description: 'Bone, joint, and muscle specialists' },
  { name: 'Pediatrics', icon: '👶', description: 'Children\'s health specialists' },
  { name: 'Gynecology', icon: '🤰', description: 'Women\'s health specialists' },
  { name: 'General Practice', icon: '🩺', description: 'General health and wellness' },
  { name: 'Ophthalmology', icon: '👁️', description: 'Eye care specialists' },
  { name: 'Dentistry', icon: '🦷', description: 'Oral health specialists' },
  { name: 'Psychiatry', icon: '💭', description: 'Mental health specialists' },
  { name: 'Radiology', icon: '🔬', description: 'Medical imaging specialists' },
  { name: 'Endocrinology', icon: '🧬', description: 'Hormone and metabolism specialists' }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing data');

    // Seed categories
    const cats = await Category.insertMany(categories.map((c, i) => ({ ...c, order: i, isActive: true })));
    console.log(`Created ${cats.length} categories`);

    // Seed admin
    const admin = await User.create({
      name: 'Admin User', email: 'admin@nexuscare.com', password: 'admin123',
      role: 'admin', isVerified: true, phone: '+1-555-0001'
    });
    console.log('Admin created: admin@nexuscare.com / admin123');

    // Seed receptionist
    await User.create({
      name: 'Jane Reception', email: 'receptionist@nexuscare.com', password: 'recep123',
      role: 'receptionist', isVerified: true, phone: '+1-555-0002'
    });
    console.log('Receptionist created: receptionist@nexuscare.com / recep123');

    // Seed patient
    const patient = await User.create({
      name: 'John Patient', email: 'patient@nexuscare.com', password: 'patient123',
      role: 'patient', isVerified: true, phone: '+1-555-0003',
      gender: 'male', bloodGroup: 'O+', dateOfBirth: new Date('1990-05-15'),
      allergies: ['Penicillin']
    });
    console.log('Patient created: patient@nexuscare.com / patient123');

    // Seed doctors
    const doctorData = [
      { name: 'Dr. Sarah Johnson', email: 'doctor@nexuscare.com', spec: 'Cardiology', fee: 150, exp: 12 },
      { name: 'Dr. Michael Chen', email: 'doctor2@nexuscare.com', spec: 'Neurology', fee: 180, exp: 15 },
      { name: 'Dr. Emily Brown', email: 'doctor3@nexuscare.com', spec: 'Dermatology', fee: 120, exp: 8 }
    ];

    const generateSchedule = () => [1, 2, 3, 4, 5].map(day => ({
      dayOfWeek: day, isWorking: true, maxPatientsPerDay: 20,
      slots: Array.from({ length: 16 }, (_, i) => {
        const h = Math.floor(i / 4) + 9;
        const m = (i % 4) * 15;
        const start = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        const endM = m + 15; const endH = endM >= 60 ? h + 1 : h;
        return { startTime: start, endTime: `${String(endH).padStart(2,'0')}:${String(endM%60).padStart(2,'0')}`, isAvailable: true };
      })
    }));

    for (let i = 0; i < doctorData.length; i++) {
      const d = doctorData[i];
      const cat = cats.find(c => c.name === d.spec);
      const user = await User.create({
        name: d.name, email: d.email, password: 'doctor123',
        role: 'doctor', isVerified: true, phone: `+1-555-010${i + 1}`, gender: i === 1 ? 'male' : 'female'
      });
      await Doctor.create({
        user: user._id, licenseNumber: `LIC${2024}${String(i + 1).padStart(4,'0')}`,
        specializations: cat ? [cat._id] : [],
        qualifications: [{ degree: 'MD', institution: 'Harvard Medical School', year: 2008 + i }],
        experience: d.exp, bio: `Experienced ${d.spec} specialist with ${d.exp} years of clinical practice.`,
        consultationFee: d.fee, consultationDuration: 15,
        languages: ['English', 'Spanish'],
        hospitalAffiliation: 'City General Hospital',
        schedule: generateSchedule(),
        isApproved: true, approvedBy: admin._id, approvedAt: new Date(),
        rating: { average: 4.5 + (Math.random() * 0.4), count: Math.floor(Math.random() * 80) + 20 }
      });
      console.log(`Doctor created: ${d.email} / doctor123`);
    }

    console.log('\n✅ Seed complete!');
    console.log('\nDemo accounts:');
    console.log('  Admin:        admin@nexuscare.com / admin123');
    console.log('  Doctor:       doctor@nexuscare.com / doctor123');
    console.log('  Doctor 2:     doctor2@nexuscare.com / doctor123');
    console.log('  Doctor 3:     doctor3@nexuscare.com / doctor123');
    console.log('  Patient:      patient@nexuscare.com / patient123');
    console.log('  Receptionist: receptionist@nexuscare.com / recep123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
