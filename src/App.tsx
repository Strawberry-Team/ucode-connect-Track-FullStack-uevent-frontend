// App.tsx
import { BrowserRouter as Router, Navigate, Route, Routes, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "@/components/authentication/LoginPage.tsx";
import RegisterPage from "@/components/authentication/RegisterPage.tsx";
import VerifyEmailPage from "@/components/authentication/VerifyEmailPage.tsx";
import PasswordResetPage from "@/components/authentication/PasswordResetPage.tsx";
import MainPage from "@/components/calendar/MainPage.tsx";
import CreateEventPage from "@/components/event/CreateEventPage.tsx";
import PageCard from "@/components/card/PageCard.tsx";
import CustomToolbarFullCalendar from "@/components/header/CustomToolbarFullCalendar.tsx";


const LayoutWithHeader = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <CustomToolbarFullCalendar />
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default function App() {
    return (
        <Router>
            <Toaster />
            {/*<AuthGuard>*/}
            <Routes>
                <Route element={<LayoutWithHeader />}>
                    <Route path="/" element={<Navigate to="/calendar" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/confirm-email/:confirm_token" element={<VerifyEmailPage />} />
                    <Route path="/password-reset/:confirm_token" element={<PasswordResetPage />} />
                    <Route path="/calendar" element={<MainPage />} />
                    <Route path="/ticket/:id" element={<PageCard />} />
                    <Route path="/new-event" element={<CreateEventPage />} />
                    <Route path="/edit-event" element={<CreateEventPage />} />
                </Route>
            </Routes>
            {/*</AuthGuard>*/}
        </Router>
    );
}