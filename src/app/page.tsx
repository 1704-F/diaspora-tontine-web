// src/app/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Coins,
  Home,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

// Composant pour l'animation des mots
// Composant pour l'animation des mots
function AnimatedWords() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const words = ["Associations", "Tontines", "Finances familiales"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className="inline-block min-w-[400px] text-left">
      <span
        key={currentIndex}
        className="inline-block animate-fade-in-up font-bold text-primary-600 text-3xl md:text-4xl"
      >
        {words[currentIndex]}
      </span>
      <span className="text-3xl md:text-4xl">,&nbsp;</span>
    </span>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary-400/5 to-primary-400/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-white/60 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo SVG from file */}
              <Image
                src="/logo.svg"
                alt="Logo"
                width={156}
                height={156}
              />
              <Badge variant="success" className="animate-bounce">
                v1.0
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="hover:scale-105 transition-transform"
                >
                  Se connecter
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary-500 hover:bg-primary-600 hover:scale-105 transition-all shadow-lg hover:shadow-xl">
                  S&apos;inscrire
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div
            className={`text-center transition-all duration-1000 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full mb-6 animate-pulse">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                La super-app de la diaspora
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Gérez vos
              <span className="block mt-2 text-primary-600 animate-gradient">
                finances collectives
              </span>
            </h1>

            <div className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed h-20 flex items-center justify-center">
              <span className="inline-flex items-center gap-2">
                <AnimatedWords />
                <span className="font-semibold text-gray-800">
                  Tout en un seul endroit.
                </span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="group bg-primary-500 hover:bg-primary-600 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                >
                  <Zap className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                  Commencer gratuitement
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Sécurisé & Transparent</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-500" />
                <span>Conformité RGPD</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary-500" />
                <span>Multi-devises</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 bg-gradient-to-b from-white/50 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez{" "}
              <span className="text-primary-600">besoin</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète pensée pour la diaspora africaine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-primary-200 bg-white/80 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Associations
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Gestion complète d&apos;associations multi-sections avec
                  transparence totale
                </p>
                <Badge variant="success" className="mt-4">
                  Disponible
                </Badge>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-primary-200 bg-white/80 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Tontines
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Épargne collective moderne avec tirages sécurisés et
                  transparents
                </p>
                <Badge variant="warning" className="mt-4">
                  Bientôt
                </Badge>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-primary-200 bg-white/80 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Budget Famille
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Gestion financière familiale avec suivi multi-devises
                </p>
                <Badge variant="secondary" className="mt-4">
                  Bientôt
                </Badge>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-primary-200 bg-white/80 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Commerce
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Marketplace pour produits et services diaspora
                </p>
                <Badge variant="secondary" className="mt-4">
                  Bientôt
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-primary-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Créez votre compte gratuitement et gérez vos finances collectives
              dès aujourd&apos;hui
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="group bg-white text-primary-600 hover:bg-gray-50 shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
              >
                <TrendingUp className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                Créer mon compte gratuitement
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo-footer.svg"
                  alt="Logo"
                  width={48}
                  height={48}
                />
              </div>
              <p className="text-gray-400 leading-relaxed">
                La plateforme de référence pour la diaspora
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <div className="space-y-2">
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Associations
                </Link>
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Tontines
                </Link>
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Tarifs
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Centre d&apos;aide
                </Link>
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Contact
                </Link>
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Statut
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <div className="space-y-2">
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Confidentialité
                </Link>
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  CGU
                </Link>
                <Link
                  href="#"
                  className="block hover:text-white transition-colors"
                >
                  Cookies
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}