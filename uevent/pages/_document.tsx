import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Предзагрузка темы перед рендерингом страницы, чтобы избежать мигания */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Проверяем, есть ли сохраненная тема
                const savedTheme = localStorage.getItem('theme');
                
                // Если темы нет, проверяем настройки системы
                const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                
                // Устанавливаем класс dark на html если нужно
                if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode) || 
                    (savedTheme === 'system' && prefersDarkMode)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}