import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi, type AdminUser } from "../../api/adminApi"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Skeleton } from "../../components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu"
import { Search, MoreVertical, ShieldAlert, ShieldCheck, Clock } from "lucide-react"

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
    case 'INACTIVE': return <Badge variant="secondary">Inactive</Badge>
    case 'BANNED': return <Badge variant="destructive">Banned</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const queryClient = useQueryClient()

  const { data: users = [], isLoading, isError } = useQuery<AdminUser[]>({
    queryKey: ['adminUsers'],
    queryFn: adminApi.getAllUsers,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
    },
  })

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStatusChange = (id: number, newStatus: string) => {
    statusMutation.mutate({ id, status: newStatus })
  }

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">View, manage, and moderate user accounts across the platform.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>All Users {!isLoading && <span className="text-muted-foreground font-normal text-sm ml-2">({users.length} total)</span>}</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : isError ? (
            <div className="p-4 text-center text-sm text-destructive border border-destructive/30 rounded-lg bg-destructive/5">
              Failed to load users. Make sure you have admin access.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-semibold">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.status !== 'ACTIVE' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'ACTIVE')}>
                                  <ShieldCheck className="w-4 h-4 mr-2 text-green-500" /> Activate
                                </DropdownMenuItem>
                              )}
                              {user.status !== 'INACTIVE' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'INACTIVE')}>
                                  <Clock className="w-4 h-4 mr-2" /> Deactivate
                                </DropdownMenuItem>
                              )}
                              {user.status !== 'BANNED' && (
                                <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(user.id, 'BANNED')}>
                                  <ShieldAlert className="w-4 h-4 mr-2" /> Ban User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
              <p>Showing {filteredUsers.length} of {users.length} users</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
