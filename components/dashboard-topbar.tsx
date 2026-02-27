import { createClient } from "@/lib/supabase/server"
import { signout } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

export async function DashboardTopBar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const displayName =
    user?.user_metadata?.full_name || user?.email || "User"

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h2 className="text-sm font-medium text-card-foreground">
          Welcome back
        </h2>
        <p className="text-xs text-muted-foreground">{displayName}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
        <form action={signout}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="mr-1 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  )
}
