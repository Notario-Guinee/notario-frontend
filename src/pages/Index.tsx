// ═══════════════════════════════════════════════════════════════
// Page Index — Page de secours par défaut de l'application
// Redirige vers le tableau de bord en cas d'URL non définie
// ═══════════════════════════════════════════════════════════════

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

export default Index;
