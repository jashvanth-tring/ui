import { useState } from 'react';
import { RootState } from '../../store/reducers';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { User } from '../../store/model';
import { Search, MoreHorizontal, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';

export default function UsersTable() {
  const { users } = useAppSelector((state: RootState) => state?.usersSelector);
  const [searchTerm, setSearchTerm] = useState('');
  const themeColor = 'var(--brand)';

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`;
    }
    return name.charAt(0);
  };

  const filteredUsers = users.filter((user: User) => {
    if (user.firstName) {
      const userName = user.firstName.toLowerCase();
      const userLastName = user.lastName ? user.lastName.toLowerCase() : '';
      return (
        userName.includes(searchTerm.toLowerCase()) ||
        userLastName.includes(searchTerm.toLowerCase())
      );
    }
    return false;
  });

  return (
    <Card className="shadow-md mb-6 border border-gray-100" style={{ borderRadius: '12px' }}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 border-b border-gray-100">
        <div>
          <CardTitle style={{ color: themeColor }}>Users</CardTitle>
          <CardDescription>Manage all users in your pipeline</CardDescription>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-white shadow-sm border-gray-200"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="font-medium" style={{ color: themeColor }}>
                  User Name
                </TableHead>
                <TableHead className="font-medium" style={{ color: themeColor }}>
                  Email
                </TableHead>
                <TableHead className="font-medium" style={{ color: themeColor }}>
                  Phone
                </TableHead>
                <TableHead className="font-medium" style={{ color: themeColor }}>
                  TRL ID
                </TableHead>
                <TableHead className="font-medium" style={{ color: themeColor }}>
                  Status
                </TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: User, index: number) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 shadow-sm">
                          <AvatarFallback
                            className="bg-gray-100 text-xs"
                            style={{ color: themeColor }}
                          >
                            {getInitials(`${user.firstName || ''} ${user.lastName || ''}`)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{`${user.firstName || ''} ${user.lastName || ''}`}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {user.officialEmail || '-'}
                    </TableCell>
                    <TableCell>{user.primaryPhone || '-'}</TableCell>
                    <TableCell>{user.trlId || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? 'default' : 'secondary'}
                        className={
                          user.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-100 shadow-sm'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-100 shadow-sm'
                        }
                      >
                        {user.isActive ? 'Active' : 'Non-Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="shadow-lg">
                          <DropdownMenuItem>
                            <Link to="#" className="flex items-center w-full">
                              View Profile <ChevronRight className="ml-2 h-4 w-4" />
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between py-4 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users
        </div>
        {filteredUsers.length > 10 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="shadow-sm">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="shadow-sm">
              Next
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
