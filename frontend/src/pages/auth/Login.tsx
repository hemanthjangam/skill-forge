import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { authApi } from "../../api/authApi"
import { useAuthStore } from "../../store/useAuthStore"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { getApiErrorMessage } from "../../lib/apiError"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState("password")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      if (loginMethod === "otp") {
        await authApi.requestLoginOtp(email)
        navigate("/verify-otp", { state: { email, next: "/student", purpose: "login" } })
      } else {
        const response = await authApi.login(email, password)
        setAuth({ 
            id: String(response.userId || "1"), 
            email: response.email || email, 
            name: response.name || "User", 
            role: response.role || "STUDENT" 
          }, 
          response.token
        )
        if (response.role === "ADMIN") navigate("/admin");
        else if (response.role === "TRAINER") navigate("/trainer");
        else navigate("/student");
      }
    } catch (error) {
      console.error(error);
      setError(getApiErrorMessage(error, "Login failed. Please check your credentials."));
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Choose your preferred method to access your account
        </CardDescription>
      </CardHeader>
      <Tabs value={loginMethod} onValueChange={setLoginMethod} className="w-full">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <TabsList className="mb-4 grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            {loginMethod === "password" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            )}

            {loginMethod === "otp" && (
              <p className="text-sm text-muted-foreground mt-2">
                We will send a one-time password to your email.
              </p>
            )}

            {error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Please wait..." : (loginMethod === "password" ? "Sign in" : "Send OTP")}
            </Button>
            <div className="text-sm text-center text-muted-foreground w-full">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Tabs>
    </Card>
  )
}
