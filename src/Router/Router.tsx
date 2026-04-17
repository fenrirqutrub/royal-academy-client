// src/router/Router.tsx
import { Navigate, Outlet, Route, Routes } from "react-router";
import Root from "../layout/Root";
import Home from "../components/Home/Home";
import AdminLayout from "../layout/AdminLayout";
import NotFound from "../pages/NotFound/NotFound";
import PrivateRoute from "./PrivateRoute";
import Photography from "../pages/Photography/Photography";
import DailyLesson from "../pages/DailyLesson/DailyLesson";
import WeeklyExam from "../pages/WeeklyExam/WeeklyExam";
import ManagePhotos from "../pages/Admin/Management/ManagePhotos";
import ManageHero from "../pages/Admin/Management/ManageHero";
import AddPhotography from "../pages/Admin/AddNewItem/AddPhotography";
import AddWeeklyExam from "../pages/Admin/AddNewItem/AddWeeklyExam";
import AddHero from "../pages/Admin/AddNewItem/AddHero";
import AddTeacher from "../pages/Admin/AddNewItem/AddTeacher";
import Dashboard from "../pages/Admin/Dashboard/Dashboard";
import Login from "../pages/Admin/Auth/Login";
import Profile from "../pages/Admin/Dashboard/Profile";
import AddDailyLesson from "../pages/Admin/AddNewItem/AddDailyLesson";
import NoticeBoard from "../pages/Notice/NoticeBoard";
import AddNotice from "../pages/Admin/AddNewItem/AddNotice";
import ManageNotice from "../pages/Admin/Management/ManageNotice";
import StudentsFiles from "../pages/StudentsFiles/StudentsFiles";
import AuthPage from "../pages/Admin/Auth/AuthPage";
import TeacherFiles from "../components/Teachers/TeacherFiles";
import MonthlyReport from "../pages/Admin/Dashboard/MonthlyReport";
import AddRoutine from "../pages/Admin/AddNewItem/AddRoutine";
import AddExamMarks from "../pages/Admin/AddNewItem/AddExamMarks";
import TeacherStudentTab from "../components/Teachers/TeacherStudentTab";
import { PRIVILEGED_ROLES, STAFF_DASHBOARD_ROLES } from "../utility/Constants";
import Signup from "../pages/Admin/Auth/SignUp";

const Router = () => {
  return (
    <Routes>
      {/* ══════════════════ PUBLIC ══════════════════ */}
      <Route path="/" element={<Root />}>
        <Route index element={<Home />} />
        <Route path="notice" element={<NoticeBoard />} />
        <Route path="photography" element={<Photography />} />
        <Route path="dailylesson" element={<DailyLesson />} />
        <Route path="weekly-exam" element={<WeeklyExam />} />

        <Route
          path="people"
          element={
            <PrivateRoute allowedRoles={PRIVILEGED_ROLES}>
              <TeacherStudentTab />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="students" replace />} />
          <Route path="students" element={<StudentsFiles />} />
          <Route path="teachers" element={<TeacherFiles />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ══════════════════ AUTH ══════════════════ */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ══════════════════ DASHBOARD — authenticated ══════════════════ */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        {/* ── authenticated users ── */}
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="monthly-report" element={<MonthlyReport />} />

        {/* ── teacher + admin + principal + owner ── */}
        <Route
          element={
            <PrivateRoute allowedRoles={STAFF_DASHBOARD_ROLES}>
              <Outlet />
            </PrivateRoute>
          }
        >
          <Route path="add-weekly-exam" element={<AddWeeklyExam />} />
          <Route path="add-daily-lesson" element={<AddDailyLesson />} />
        </Route>

        {/* ── only admin / principal / owner ── */}
        <Route
          element={
            <PrivateRoute allowedRoles={PRIVILEGED_ROLES}>
              <Outlet />
            </PrivateRoute>
          }
        >
          <Route path="add-teacher" element={<AddTeacher />} />
          <Route path="add-photography" element={<AddPhotography />} />
          <Route path="add-hero" element={<AddHero />} />
          <Route path="add-notice" element={<AddNotice />} />
          <Route path="add-routine" element={<AddRoutine />} />
          <Route path="add-exam-marks" element={<AddExamMarks />} />
          <Route path="management/photos" element={<ManagePhotos />} />
          <Route path="management/heroes" element={<ManageHero />} />
          <Route path="management/notice" element={<ManageNotice />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Router;
