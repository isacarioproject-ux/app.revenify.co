import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, Mail, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!email) {
            toast.error('Please enter your email')
            return
        }

        setLoading(true)
        
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) throw error

            setEmailSent(true)
            toast.success('Magic link sent!', {
                description: 'Check your inbox'
            })
        } catch (error: any) {
            toast.error('Error sending link', {
                description: error.message
            })
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) throw error
        } catch (error: any) {
            toast.error('Error logging in with Google', {
                description: error.message
            })
        }
    }

    if (emailSent) {
        return (
            <section className="flex min-h-screen items-center justify-center px-4 py-16">
                <div className="w-full max-w-md text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="mb-2 text-xl font-semibold">Check your email</h1>
                        <p className="text-muted-foreground mb-6">
                            We sent a magic link to <strong>{email}</strong>
                        </p>
                        <p className="text-muted-foreground text-sm mb-6">
                            Click the link in the email to log in. The link expires in 1 hour.
                        </p>
                        <Button 
                            variant="outline" 
                            onClick={() => setEmailSent(false)}
                            className="w-full"
                        >
                            Use another email
                        </Button>
                </div>
            </section>
        )
    }

    return (
        <section className="flex min-h-screen items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                    <form onSubmit={handleMagicLink}>
                        <div className="text-center mb-6">
                            <Link to="/" aria-label="go home" className="inline-block">
                                <img src="/logo.png" alt="Revenify" className="h-12 w-auto" />
                            </Link>
                            <h1 className="mb-1 mt-4 text-2xl font-semibold">Log in to Revenify</h1>
                            <p className="text-muted-foreground">Welcome back! Log in to continue</p>
                        </div>

                    <div className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleLogin}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="0.98em"
                                height="1em"
                                viewBox="0 0 256 262">
                                <path
                                    fill="#4285f4"
                                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                                <path
                                    fill="#34a853"
                                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                                <path
                                    fill="#fbbc05"
                                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"></path>
                                <path
                                    fill="#eb4335"
                                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
                            </svg>
                            <span>Google</span>
                        </Button>
                    </div>

                    <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <hr className="border-dashed" />
                        <span className="text-muted-foreground text-xs">Or continue with email</span>
                        <hr className="border-dashed" />
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="block text-sm">
                                Email
                            </Label>
                            <Input
                                type="email"
                                required
                                name="email"
                                id="email"
                                placeholder="you@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <Button className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send magic link
                                </>
                            )}
                        </Button>
                    </div>

                    <p className="text-center text-sm mt-6">
                        Don't have an account?
                        <Button
                            asChild
                            variant="link"
                            className="px-2">
                            <Link to="/auth?mode=signup">Sign up</Link>
                        </Button>
                    </p>
                    </form>
            </div>
        </section>
    )
}
