import ProductCard from "./ProductCard";

const ProductCardList: React.FC = () => {
    return (
        <div className="px-custom flex flex-wrap gap-6 p-4">
            {Array.from({ length: 10 }).map((_, index) => (
                <div
                    key={index}
                    className="flex-grow min-w-[270px] basis-[calc(25%-1.5rem)]"
                >
                    <ProductCard index={index} />
                </div>
            ))}
        </div>
    );
};

export default ProductCardList;