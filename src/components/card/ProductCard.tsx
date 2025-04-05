// ProductCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import LogoImage from "@/assets/logo_white.png";
import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
    index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ index }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/ticket/${index + 1}`, {
            state: {
                title: `Ticket ${index + 1}`,
                date: "March 16th, 2025 10:00",
                description: `Hello everyone, I invite you to my cool concert, I'm waiting for everyone ${index + 1}`,
                price: `${(index + 1) * 10}.00 - ${(index + 1) * 20}.00 $`,
                image: LogoImage,
            },
        });
    };

    return (
        <Card
            className="cursor-pointer w-full bg-white flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-2xl"
            onClick={handleClick}
        >
            {/* Место для изображения */}
            <div
                className="h-60 flex items-center justify-center bg-contain bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url(${LogoImage})`,
                }}
            />
            {/* Контент карточки */}
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="text-[20px] font-semibold text-gray-800">
                        Ticket {index + 1}
                    </h3>
                    <p className="text-[16px] text-gray-600">
                        March 16th, 2025 10:00
                    </p>
                    <p className="text-sm text-gray-600">
                        Hello everyone, I invite you to my cool concert, I'm waiting for everyone {index + 1}
                    </p>
                </div>
                <div className="mt-2">
                    <span className="text-xl font-bold text-gray-900">
                        {(index + 1) * 10}.00 - {(index + 1) * 20}.00 $
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductCard;