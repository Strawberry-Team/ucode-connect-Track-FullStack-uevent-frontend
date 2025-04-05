
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import ProductCardList from "@/components/card/ProductCardList.tsx";
import PopularCardsCarousel from "@/components/card/PopularCardsCarousel.tsx";

export default function MainPage() {


    return (
        <SidebarProvider>

            <SidebarInset>
                <PopularCardsCarousel />
                <ProductCardList />
            </SidebarInset>
        </SidebarProvider>
    );
}