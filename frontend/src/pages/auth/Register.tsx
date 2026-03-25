import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { authApi } from "../../api/authApi"
import type { Role } from "../../types/auth"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs"
import { getApiErrorMessage } from "../../lib/apiError"

export function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("STUDENT")
  const [educationLevel, setEducationLevel] = useState("")
  const [learningGoal, setLearningGoal] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [bio, setBio] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      await authApi.register({
        name,
        email,
        password,
        role,
        ...(role === "STUDENT" ? { educationLevel, learningGoal } : {}),
        ...(role === "TRAINER" ? { specialization, bio } : {})
      })
      navigate("/login")
    } catch (error) {
      console.error(error)
      setError(getApiErrorMessage(error, "Registration failed. Email might already exist."))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-white/10 bg-card/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)]">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information to create a student account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Tabs value={role} onValueChange={(val) => setRole(val as Role)} className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="STUDENT">Student</TabsTrigger>
              <TabsTrigger value="TRAINER">Trainer</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required 
                />
              </div>

              <TabsContent value="STUDENT" className="space-y-4 mt-0">
                 <div className="space-y-2">
                  <Label htmlFor="education">Education Level (Optional)</Label>
                  <Input 
                    id="education" 
                    placeholder="e.g. Undergraduate, High School"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="goal">Learning Goal (Optional)</Label>
                  <Input 
                    id="goal" 
                    placeholder="What do you want to learn?"
                    value={learningGoal}
                    onChange={(e) => setLearningGoal(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="TRAINER" className="space-y-4 mt-0">
                 <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization (Optional)</Label>
                  <Input 
                    id="specialization" 
                    placeholder="e.g. Frontend, Data Science"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Tell us about your teaching experience"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="resize-none"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
          <div className="text-sm text-center w-full text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
