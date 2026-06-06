import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Hero from "./pages/Hero"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import MyCourses from "./pages/MyCourses"
import Courses from "./pages/Courses"
import Progress from "./pages/Progress"
import CourseDetail from "./pages/CourseDetail"
import CreateCourse from "./pages/CreateCourse"
import AddLesson from "./pages/AddLesson"
import LessonDetail from "./pages/LessonDetail"
import EditCourse from "./pages/EditCourse"
import EditLesson from "./pages/EditLesson"
import Quizzes from "./pages/Quizzes"
import Assignments from "./pages/Assignments"
import Certificates from "./pages/Certificates"
import AIAssistant from "./pages/AIAssistant"
import Admin from "./pages/Admin"
import CourseStudents from "./pages/CourseStudents"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Leaderboard from "./pages/Leaderboard"
import Payments from "./pages/Payments"
import OrganizationManagement from "./pages/OrganizationManagement"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Authenticated routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/create" element={<CreateCourse />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/courses/:courseId/edit" element={<EditCourse />} />
        <Route path="/courses/:courseId/add-lesson" element={<AddLesson />} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonDetail />} />
        <Route path="/courses/:courseId/lessons/:lessonId/edit" element={<EditLesson />} />
        <Route path="/courses/:courseId/quizzes" element={<Quizzes />} />
        <Route path="/courses/:courseId/assignments" element={<Assignments />} />
        <Route path="/courses/:courseId/students" element={<CourseStudents />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/organizations" element={<OrganizationManagement />} />
        <Route path="/admin" element={<Admin />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
