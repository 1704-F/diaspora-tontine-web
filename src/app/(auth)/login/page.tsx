// ============================================
// 2. PAGE LOGIN (src/app/(auth)/login/page.tsx)
// ============================================
import { LoginForm } from '@/components/auth/LoginForm'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}