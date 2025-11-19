import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // Verifica se existe um usuário salvo no navegador
  const userId = localStorage.getItem("userId");

  // Se NÃO tiver usuário (não está logado)
  if (!userId) {
    // Redireciona para a Landing Page (/)
    // "replace" impede que ele volte para a página protegida pelo botão "Voltar"
    return <Navigate to="/" replace />;
  }

  // Se estiver logado, deixa passar e mostra a página (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;