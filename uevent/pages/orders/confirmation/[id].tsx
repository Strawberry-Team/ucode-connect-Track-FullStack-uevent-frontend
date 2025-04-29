// src/pages/orders/confirmation/[orderId].tsx
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { orderService} from '../../../services/orderService';
const POLLING_INTERVAL = 3000; // 3 секунды
const POLLING_TIMEOUT = 120000; // 30 секунд

const OrderConfirmationPage: React.FC = () => {
    const router = useRouter();
    // Извлекаем orderId и параметры из URL
    const { id, payment_intent, payment_intent_client_secret, redirect_status } = router.query;
    const orderId = Array.isArray(id) ? id[0] : id;
    const [loading, setLoading] = useState(true);
    const [orderStatus, setOrderStatus] = useState<string | null>(null); // Статус из НАШЕГО API
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimers = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    useEffect(() => {
        // Функция для запроса статуса заказа с бэкенда
        const checkOrderStatus = async (): Promise<boolean> => { // Возвращает true если статус финальный
            if (!orderId || typeof orderId !== 'string') {
                setError('Invalid Order ID in URL.');
                setLoading(false);
                return true; // Считаем финальным, чтобы остановить поллинг
            }

            try {
                console.log(`Checking order status for ${orderId}...`);
                // Шаг 6: Запрос актуального статуса
                const response = await orderService.getOrderById(orderId);

                const currentStatus = response.paymentStatus;
                console.log(`Received order status: ${currentStatus}`);
                setOrderStatus(currentStatus);

                // Проверяем, является ли статус финальным
                const isFinalStatus = ['PAID', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(currentStatus);
                if (isFinalStatus) {
                    setLoading(false);
                    clearTimers();
                }
                return isFinalStatus;

            } catch (err: any) {
                console.error('Error checking order status:', err);
                // Показываем ошибку, только если это первая загрузка, иначе поллинг просто остановится
                if(loading) setError(err.response?.data?.message || 'Could not verify payment status.');
                setLoading(false);
                clearTimers();
                return true; // Считаем финальным при ошибке
            }
        };

        // --- Логика запуска проверки и поллинга ---
        if (router.isReady) { // Убедимся, что query параметры доступны
            setLoading(true);
            setError(null);
            console.log('Confirmation page loaded. Initial check...');
            checkOrderStatus().then(isFinal => {
                // Запускаем поллинг только если:
                // 1. Статус еще не финальный (например, PENDING)
                // 2. Был редирект со Stripe (есть redirect_status)
                if (!isFinal) {
                    console.log(`Status is not final (${orderStatus}), starting polling...`);
                    intervalRef.current = setInterval(async () => {
                        console.log('Polling order status...');
                        const final = await checkOrderStatus();
                        if (final) {
                            console.log('Polling stopped: final status received.');
                            clearTimers();
                        }
                    }, POLLING_INTERVAL);


                    // Устанавливаем таймаут для поллинга
                    timeoutRef.current = setTimeout(() => {
                        console.warn('Polling timeout reached for order', orderId);
                        clearTimers();
                        // Если статус все еще не финальный после таймаута
                        if (!['PAID', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(orderStatus ?? '')) {
                            setError('Payment status verification timed out. Please check "My Orders" or contact support.');
                        }
                        setLoading(false); // Показываем текущий статус или ошибку таймаута
                    }, POLLING_TIMEOUT);
                } else {
                    // Если статус сразу финальный или не было редиректа - поллинг не нужен
                    console.log(`Polling not needed. Initial status: ${orderStatus}, Is final: ${isFinal}, Redirect status: ${redirect_status}`);
                    setLoading(false);
                }
            });
        }

        // Очистка таймеров при размонтировании
        return () => {
            clearTimers();
        };
        // Перезапускаем эффект при изменении orderId или если router стал готов
    }, [orderId, router.isReady, redirect_status]);

    // --- Рендеринг контента ---
    const renderContent = () => {
        if (loading) {
            return <div>Verifying payment status... Please wait.</div>;
        }
        if (error) {
            return <div style={{ color: 'red' }}>Error: {error}</div>;
        }

        switch (orderStatus) {
            case 'PAID':
                return (
                    <div style={{ color: 'green' }}>
                        <h2>Payment Successful!</h2>
                        <p>Thank you! Your tickets for order #{orderId} are confirmed.</p>
                    </div>
                );
            case 'FAILED':
                return (
                    <div style={{ color: 'red' }}>
                        <h2>Payment Failed</h2>
                        <p>Payment for order #{orderId} could not be processed.</p>
                        <p>Your ticket reservation has been cancelled. Please try creating a new order.</p>
                    </div>
                );
            case 'CANCELLED':
                return (
                    <div style={{ color: 'grey' }}>
                        <h2>Order Cancelled</h2>
                        <p>Order #{orderId} was cancelled.</p>
                    </div>
                );
            case 'PENDING':
                return (
                    <div style={{ color: 'orange' }}>
                        <h2>Payment Processing</h2>
                        <p>Your payment for order #{orderId} is still processing.</p>
                        <p>This page should update automatically. If not, please check "My Orders" shortly.</p>
                    </div>
                );
            case 'REFUNDED':
                return (
                    <div style={{ color: 'blue' }}>
                        <h2>Payment Refunded</h2>
                        <p>Your payment for order #{orderId} has been refunded.</p>
                    </div>
                );
            default: // Неизвестный или null статус
                return (
                    <div>
                        <h2>Verifying Status</h2>
                        <p>Checking the final status for order #{orderId}.</p>
                    </div>
                );
        }
    };

    return (
        <div>
            <h1>Order Confirmation</h1>
            {renderContent()}
            <div style={{ marginTop: '20px' }}>
                <Link href="/orders">View My Orders</Link> {/* Ссылка на страницу заказов пользователя */}
                {' | '}
                <Link href="/events">Browse More Events</Link> {/* Ссылка на список мероприятий */}
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
