import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { authApi } from "../../api/authApi"
import { useAuthStore } from "../../store/useAuthStore"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { getApiErrorMessage } from "../../lib/apiError"

export function VerifyOtp() {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  
  const state = location.state as { email?: string; next?: string; purpose?: "login" | "reset" } | null
  const email = state?.email
  const nextTarget = state?.next || "/student"
  const purpose = state?.purpose || (nextTarget === "/reset-password" ? "reset" : "login")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Missing email context. Please restart the OTP flow.")
      return
    }
    setIsLoading(true)
    setError("")
    setInfo("")
    
    try {
      if (nextTarget === "/reset-password") {
        navigate(nextTarget, { state: { email, otp } })
      } else {
        const response = await authApi.verifyLoginOtp(email, otp)
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
        else navigate(nextTarget);
      }
    } catch (error) {
      console.error(error);
      setError(getApiErrorMessage(error, "Verification failed. Invalid or expired OTP."))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || isResending) return

    setIsResending(true)
    setError("")
    setInfo("")
    try {
      if (purpose === "reset") {
        await authApi.requestForgotPasswordOtp(email)
      } else {
        await authApi.requestLoginOtp(email)
      }
      setInfo("A new OTP has been sent to your email.")
    } catch (error) {
      console.error(error)
      setError(getApiErrorMessage(error, "Failed to resend OTP."))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
      <CardHeader>
        <CardTitle>Verify OTP</CardTitle>
        <CardDescription>
          {email ? `Enter the 6-digit code sent to ${email}` : "Restart the OTP flow from login or forgot password."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">One-Time Password</Label>
            <Input 
              id="otp" 
              placeholder="123456" 
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center text-lg tracking-[0.5em]"
              required 
            />
          </div>
          {info ? (
            <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {info}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading || otp.length < 6 || !email}>
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Didn't receive a code?{" "}
            <Button type="button" variant="link" className="p-0 h-auto" onClick={handleResend} disabled={!email || isResending}>
              {isResending ? "Resending..." : "Resend"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
