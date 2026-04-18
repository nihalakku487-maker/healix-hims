import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PatientProfile() {
  const { phone } = useParams();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-lg border-0 shadow-md">
        <CardContent className="p-6 space-y-2">
          <p className="text-lg font-semibold text-foreground">Patient Profile</p>
          <p className="text-sm text-muted-foreground">
            Phone: <span className="font-mono text-foreground">{phone ?? '—'}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            This page will show visit history and allow uploading prescriptions, lab reports, and scans.
          </p>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button asChild variant="outline" className="w-full">
            <Link to="/frontdesk">Back to Front Desk</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

