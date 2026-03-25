import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { authApi } from "../../api/authApi"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { getApiErrorMessage } from "../../lib/apiError"

export function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  
  const state = location.state as { email?: string; otp?: string } | null
  const email = state?.email
  const otp = state?.otp

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (!email || !otp) {
      setError("Missing email or OTP. Please restart the password reset process.")
      return;
    }
    setIsLoading(true)

    try {
      await authApi.resetPassword(email, otp, password)
      navigate("/login")
    } catch (error) {
      console.error(error)
      setError(getApiErrorMessage(error, "Failed to reset password. The OTP might be expired or invalid."))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          </div>
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || !password || !confirmPassword}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
