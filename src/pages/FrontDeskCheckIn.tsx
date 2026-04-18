import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FrontDeskCheckIn() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-0 shadow-md">
        <CardContent className="p-6 space-y-2">
          <p className="text-lg font-semibold text-foreground">QR Check-in</p>
          <p className="text-sm text-muted-foreground">
            This screen will scan a patient&apos;s QR code and mark them as arrived.
          </p>
        </CardContent>
        <CardFooter className="p-6 pt-0 flex gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link to="/frontdesk">Back</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

