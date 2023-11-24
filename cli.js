import inquirer from 'inquirer';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'students',
  password: 'admin',
  port: 5432
});

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('DROP TABLE IF EXISTS students');
    await client.query(`CREATE TABLE students (
      student_id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      enrollment_date DATE
    )`);
    await client.query(`INSERT INTO students (first_name, last_name, email, enrollment_date) VALUES
      ('John', 'Doe', 'john.doe@example.com', '2023-09-01'),
      ('Jane', 'Smith', 'jane.smith@example.com', '2023-09-01'),
      ('Jim', 'Beam', 'jim.beam@example.com', '2023-09-02')`);
    console.log("Database initialized.");
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};

const mainMenuQuestions = [
  {
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: ['View All Students', 'Add Student', 'Update Student Email', 'Delete Student', 'Exit'],
  },
];

const addStudentQuestions = [
  { type: 'input', name: 'firstName', message: 'First Name:' },
  { type: 'input', name: 'lastName', message: 'Last Name:' },
  { type: 'input', name: 'email', message: 'Email:' },
  { type: 'input', name: 'enrollmentDate', message: 'Enrollment Date (YYYY-MM-DD):' },
];

const updateStudentEmailQuestions = [
  { type: 'input', name: 'studentId', message: 'Student ID:' },
  { type: 'input', name: 'newEmail', message: 'New Email:' },
];

const deleteStudentQuestion = [
  { type: 'input', name: 'studentId', message: 'Student ID to delete:' },
];

const getAllStudents = async () => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM students ORDER BY student_id');
    const formattedData = res.rows.map(student => {
      return {
        'Student ID': student.student_id,
        'First Name': student.first_name,
        'Last Name': student.last_name,
        'Email': student.email,
        'Enrollment Date': student.enrollment_date.toISOString().split('T')[0]
      };
    });
    console.table(formattedData);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
  }
};

const addStudent = async (answers) => {
  const client = await pool.connect();
  try {
    const res = await client.query('INSERT INTO students (first_name, last_name, email, enrollment_date) VALUES ($1, $2, $3, $4) RETURNING *', [answers.firstName, answers.lastName, answers.email, answers.enrollmentDate]);
    console.log('Student added:', res.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
  }
};

const updateStudentEmail = async (answers) => {
  const client = await pool.connect();
  try {
    const res = await client.query('UPDATE students SET email = $1 WHERE student_id = $2 RETURNING *', [answers.newEmail, answers.studentId]);
    console.log('Student email updated:', res.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
  }
};

const deleteStudent = async (answers) => {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM students WHERE student_id = $1', [answers.studentId]);
    console.log('Student deleted successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
  }
};

const main = async () => {
  await initializeDatabase();
  
  let exit = false;
  while (!exit) {
    const answers = await inquirer.prompt(mainMenuQuestions);
    switch (answers.action) {
      case 'View All Students':
        await getAllStudents();
        break;
      case 'Add Student':
        const addAnswers = await inquirer.prompt(addStudentQuestions);
        await addStudent(addAnswers);
        break;
      case 'Update Student Email':
        const updateAnswers = await inquirer.prompt(updateStudentEmailQuestions);
        await updateStudentEmail(updateAnswers);
        break;
      case 'Delete Student':
        const deleteAnswers = await inquirer.prompt(deleteStudentQuestion);
        await deleteStudent(deleteAnswers);
        break;
      case 'Exit':
        exit = true;
        break;
    }
  }
  await pool.end();
};

main().catch(err => console.error(err));
