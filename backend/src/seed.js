/**
 * Seed script -- populates the database with demo data for testing.
 * Run with:  node src/seed.js
 * Wipes existing jobs and users, then inserts fresh demo data.
 */
const mongoose = require('mongoose')
require('dotenv').config()

const User        = require('./models/User')
const Job         = require('./models/Job')
const Application = require('./models/Application')

const JOBS = [
  {
    title: 'Senior React Developer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salary: '$120k - $160k',
    description: 'Build and maintain our core product frontend. You will own the component library, performance budgets, and frontend architecture decisions.',
    requirements: ['React', 'TypeScript', 'GraphQL', 'Tailwind', '5+ years experience'],
    status: 'active',
  },
  {
    title: 'DevOps Lead',
    department: 'Infrastructure',
    location: 'Hyderabad, IN',
    type: 'Full-time',
    salary: '$100k - $130k',
    description: 'Own our CI/CD pipeline, Kubernetes clusters, and infrastructure-as-code strategy.',
    requirements: ['Kubernetes', 'AWS', 'Terraform', 'GitHub Actions', '4+ years experience'],
    status: 'active',
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90k - $120k',
    description: 'Define the visual language of SmartHire. Lead end-to-end design from research to Figma specs.',
    requirements: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
    status: 'active',
  },
  {
    title: 'Backend Engineer',
    department: 'Engineering',
    location: 'Bangalore, IN',
    type: 'Full-time',
    salary: '$95k - $130k',
    description: 'Build and scale our Node.js + MongoDB API. Own resume parsing, AI ranking pipelines.',
    requirements: ['Node.js', 'MongoDB', 'Redis', 'BullMQ'],
    status: 'active',
  },
  {
    title: 'Frontend Intern',
    department: 'Engineering',
    location: 'Remote',
    type: 'Internship',
    salary: '$25/hr',
    description: '10-week summer internship. Build real features alongside senior engineers.',
    requirements: ['React', 'CSS', 'Git'],
    status: 'active',
  },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // Clear existing data
  await User.deleteMany({})
  await Job.deleteMany({})
  await Application.deleteMany({})
  console.log('Cleared existing data')

  // Create recruiter
  const recruiter = await User.create({
    name: 'Rohit M',
    email: 'recruiter@smarthire.com',
    password: 'password123',
    role: 'recruiter',
  })
  console.log('Created recruiter:', recruiter.email)

  // Create candidate
  const candidate = await User.create({
    name: 'Priya Patel',
    email: 'candidate@smarthire.com',
    password: 'password123',
    role: 'candidate',
  })
  console.log('Created candidate:', candidate.email)

  // Create jobs
  const jobs = await Job.insertMany(
    JOBS.map(j => ({ ...j, postedBy: recruiter._id }))
  )
  console.log(`Created ${jobs.length} jobs`)

  // Create a sample application
  await Application.create({
    job: jobs[0]._id,
    candidate: candidate._id,
    personalInfo: {
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'candidate@smarthire.com',
      phone: '+91 98765 43210',
      experience: '3-5 years',
      linkedin: 'https://linkedin.com/in/priyapatel',
    },
    coverLetter: 'I am excited about this role because I have been working with React for 4 years and would love to join a team building tools that make hiring more human.',
    source: 'LinkedIn',
    stage: 'Screening',
    stageHistory: [
      { stage: 'Applied',   note: 'Application submitted' },
      { stage: 'Screening', note: 'Resume shortlisted by recruiter' },
    ],
    score: 84,
  })
  console.log('Created sample application')

  console.log('\nSeed complete. Login credentials:')
  console.log('  Recruiter: recruiter@smarthire.com / password123')
  console.log('  Candidate: candidate@smarthire.com / password123')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
