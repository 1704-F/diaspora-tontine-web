// ============================================
// 8. PAGE ACCUEIL ROOT (src/app/page.tsx)
// ============================================
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded text-white font-bold text-sm">
                DT
              </div>
              <span className="text-xl font-semibold text-gray-900">
                DiasporaTontine
              </span>
              <Badge variant="success" className="ml-2">v1.0</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Se connecter</Button>
              </Link>
              <Link href="/register">
                <Button>S&apos;inscrire</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            La <span className="text-primary-500">super-app</span> de la <br />
            diaspora africaine
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Gérez vos associations, participez à des tontines, organisez vos finances familiales. Tout en un seul endroit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                🚀 Commencer maintenant
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              📱 Télécharger l&apos;app
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Tout ce dont votre communauté a besoin
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🏛️</div>
                <h3 className="text-xl font-semibold mb-2">Associations</h3>
                <p className="text-gray-600">
                  Gestion complète d&apos;associations multi-sections avec transparence totale
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold mb-2">Tontines</h3>
                <p className="text-gray-600">
                  Épargne collective moderne avec tirages sécurisés et transparents
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-xl font-semibold mb-2">Budget Famille</h3>
                <p className="text-gray-600">
                  Gestion financière familiale diaspora avec suivi multi-devises
                </p>
                <Badge variant="secondary" className="mt-2">Bientôt</Badge>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🏪</div>
                <h3 className="text-xl font-semibold mb-2">Commerce</h3>
                <p className="text-gray-600">
                  Marketplace communautaire pour produits et services diaspora
                </p>
                <Badge variant="secondary" className="mt-2">Bientôt</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à rejoindre la communauté ?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Plus de 10,000 personnes nous font déjà confiance
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-primary-500 hover:bg-gray-100">
              Créer mon compte gratuitement
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded text-white font-bold text-sm">
                  DT
                </div>
                <span className="text-xl font-semibold text-white">
                  DiasporaTontine
                </span>
              </div>
              <p className="text-gray-400">
                La plateforme de référence pour les communautés diaspora
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <div className="space-y-2">
                <a href="#" className="block hover:text-white">Associations</a>
                <a href="#" className="block hover:text-white">Tontines</a>
                <a href="#" className="block hover:text-white">Tarifs</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <a href="#" className="block hover:text-white">Centre d&apos;aide</a>
                <a href="#" className="block hover:text-white">Contact</a>
                <a href="#" className="block hover:text-white">Statut</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <div className="space-y-2">
                <a href="#" className="block hover:text-white">Confidentialité</a>
                <a href="#" className="block hover:text-white">CGU</a>
                <a href="#" className="block hover:text-white">Cookies</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DiasporaTontine. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
