import { Avatar, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { NavUser } from "@/components/calendar/NavUser.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useNavigate } from "react-router-dom";

export default function CustomToolbarFullCalendar() {
    const user = null; // Замени на реальный источник данных, если есть
    const navigate = useNavigate();

    const handleLogoClick = () => {
        navigate("/calendar"); // Перенаправление на главную страницу
    };

    return (
        <header className="z-30 px-custom sticky top-0 flex h-17 shrink-0 items-center gap-2 border-b bg-background/85">
            <div className="flex items-center justify-between gap-4 w-full relative">
                {/* Логотип и название слева */}
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={handleLogoClick}
                >
                    <Avatar className="h-13 w-13 rounded-lg shrink-0">
                        <AvatarImage src="/logo_favicon.png" alt="Логотип" />
                    </Avatar>
                    <span className="text-[24px] font-medium">Calendula</span>
                </div>

                {/* Поле поиска в центре */}
                <div className="flex-1 flex justify-center">
                    <Input
                        type="text"
                        placeholder="Find events..."
                        className="text-[16px] py-5 px-5 font-medium w-full max-w-md rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Пользователь или кнопка Sign up справа */}
                <div>
                    {user ? (
                        <NavUser user={user} />
                    ) : (
                        <Button
                            variant="outline"
                            className="text-[16px] py-5 px-7 rounded-full font-medium"
                        >
                            Sign up
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}