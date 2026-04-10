// src/router/Router.tsx
import { Navigate, Route, Routes } from "react-router";
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

import Signup from "../pages/Admin/Auth/SignUp";
import StudentsFiles from "../pages/StudentsFiles/StudentsFiles";
import AuthPage from "../pages/Admin/Auth/AuthPage";
import TeacherFiles from "../components/Teachers/TeacherFiles";
import MonthlyReport from "../pages/Admin/Dashboard/MonthlyReport";
import AddRoutine from "../pages/Admin/AddNewItem/AddRoutine";
import AddExamMarks from "../pages/Admin/AddNewItem/AddExamMarks";
import TeacherStudentTab from "../components/Teachers/TeacherStudentTab";

// ── Role groups ───────────────────────────────────────────────────────────────
const STAFF = ["teacher", "admin", "principal", "owner"] as const;
const PRIVILEGED = ["admin", "principal", "owner"] as const;

const Router = () => {
  return (
    <Routes>
      <Route path="*" element={<NotFound />} />
      {/* ══════════════════ PUBLIC — সবাই দেখতে পাবে ══════════════════ */}
      <Route path="/" element={<Root />}>
        <Route index element={<Home />} />
        <Route path="notice" element={<NoticeBoard />} />
        <Route path="photography" element={<Photography />} />
        <Route path="dailylesson" element={<DailyLesson />} />
        <Route path="weekly-exam" element={<WeeklyExam />} />
        <Route
          path="people"
          element={
            <PrivateRoute allowedRoles={[...PRIVILEGED]}>
              <TeacherStudentTab />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="students" replace />} />

          <Route
            path="students"
            element={
              <PrivateRoute allowedRoles={[...PRIVILEGED]}>
                <StudentsFiles />
              </PrivateRoute>
            }
          />

          <Route
            path="teachers"
            element={
              <PrivateRoute allowedRoles={[...PRIVILEGED]}>
                <TeacherFiles />
              </PrivateRoute>
            }
          />
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
        {/* ── সবাই (authenticated) ── */}
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        {/* ── teacher + privileged — student বাদ ── */}
        <Route
          path="add-weekly-exam"
          element={
            <PrivateRoute allowedRoles={[...STAFF]}>
              <AddWeeklyExam />
            </PrivateRoute>
          }
        />
        <Route
          path="add-daily-lesson"
          element={
            <PrivateRoute allowedRoles={[...STAFF]}>
              <AddDailyLesson />
            </PrivateRoute>
          }
        />
        <Route path="/dashboard/monthly-report" element={<MonthlyReport />} />
        {/* ── শুধু admin / principal / owner ── */}
        <Route
          path="add-teacher"
          element={
            <PrivateRoute allowedRoles={[...PRIVILEGED]}>
              <AddTeacher />
            </PrivateRoute>
          }
        />
        <Route
          path="add-photography"
          element={
            <PrivateRoute allowedRoles={[...PRIVILEGED]}>
              <AddPhotography />
            </PrivateRoute>
          }
        />
        <Route
          path="add-hero"
          element={
            <PrivateRoute allowedRoles={[...PRIVILEGED]}>
              <AddHero />
            </PrivateRoute>
          }
        />
        <Route
          path="add-notice"
          element={
            <PrivateRoute allowedRoles={[...PRIVILEGED]}>
              <AddNotice />
            </PrivateRoute>
          }
        />
        <Route
          path="add-routine"
          element={
            <PrivateRoute allowedRoles={[...PRIVILEGED]}>
              <AddRoutine />
            </PrivateRoute>
          }
        />{" "}
        <Route
          path="add-exam-marks"
          element={
            <PrivateRoute allowedRoles={[...PRIVILEGED]}>
              <AddExamMarks />
            </PrivateRoute>
          }
        />
        <Route
          path="management/photos"
          element={
            <PrivateRoute allowedRoles={[...PRIVILEGED]}>
              <ManagePhotos />
            </PrivateRoute>
          }
        />
        <Route
          path="management/heroes"
          element={
            <PrivateRoute allowedRoles={[...PRIVILEGED]}>
              <ManageHero />
            </PrivateRoute>
          }
        />
        <Route
          path="management/notice"
          element={
            <PrivateRoute allowedRoles={[...PRIVILEGED]}>
              <ManageNotice />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default Router;
