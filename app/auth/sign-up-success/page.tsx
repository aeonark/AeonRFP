import Link from "next/link"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SignUpSuccessPage() {
  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <MailCheck className="h-6 w-6 text-accent" />
        </div>
        <CardTitle className="text-xl text-card-foreground">Check Your Email</CardTitle>
        <CardDescription>
          We sent a confirmation link to your email address. Please verify your
          account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/auth/login">Back to Sign In</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
