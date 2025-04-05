// TicketPage.tsx (или PageCard.tsx)
import React from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PageCard: React.FC = () => {
    const location = useLocation();
    const { title, date, description, price, image } = location.state || {};

    // Если данных нет, показываем сообщение
    if (!title) {
        return <div className="px-custom py-4">Ticket not found</div>;
    }

    const handleBuy = () => {
        // Здесь можно добавить логику покупки (например, вызов API)
        alert(`Purchasing ${title} for ${price}`);
    };

    return (
        <div className="px-custom py-4 w-full">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Фото слева */}
                <div className="shrink-0 w-full md:w-96">
                    <div
                        className="h-96 w-full bg-contain bg-center bg-no-repeat rounded-lg"
                        style={{
                            backgroundImage: `url(${image})`,
                        }}
                    />
                </div>
                {/* Текст справа */}
                <div className="flex flex-col gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
                    <p className="text-xl text-gray-600">{date}</p>
                    <p className="text-lg text-gray-600">{description}</p>
                    <p className="text-2xl font-semibold text-gray-900">{price}</p>
                    <Button
                        className="mt-4 w-full md:w-auto"
                        onClick={handleBuy}
                    >
                        Buy
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PageCard;