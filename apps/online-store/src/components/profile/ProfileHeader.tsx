import { User } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Edit } from "lucide-react";
import { format } from "date-fns";

interface ProfileHeaderProps {
  user: User;
  onEditClick: () => void;
}

export const ProfileHeader = ({ user, onEditClick }: ProfileHeaderProps) => {
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const memberSince = format(new Date(user.memberSince), 'MMMM yyyy');

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-gradient-subtle rounded-lg border">
      <Avatar className="h-24 w-24">
        <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-2xl font-bold mb-1">
          {user.firstName} {user.lastName}
        </h2>
        <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
          <p className="text-muted-foreground">{user.email}</p>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
          <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
          {user.membership && (
            <Badge variant={user.membership.status === 'active' ? 'default' : 'secondary'}>
              {user.membership.plan.toUpperCase()} {user.membership.status}
            </Badge>
          )}
        </div>
      </div>
      
      <Button onClick={onEditClick} className="gap-2">
        <Edit className="h-4 w-4" />
        Edit Profile
      </Button>
    </div>
  );
};
