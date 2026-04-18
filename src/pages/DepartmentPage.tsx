import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Stethoscope } from 'lucide-react';

type Department = { id: string; name: string; hospital_id: string };
type Doctor = {
  id: string;
  name: string;
  specialty: string | null;
  fee: number | null;
  department_id: string | null;
  active: boolean;
};

export default function DepartmentPage() {
  const { departmentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<Department | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!departmentId) return;
      setLoading(true);

      const { data: deptRow } = await supabase
        .from('departments')
        .select('id,name,hospital_id')
        .eq('id', departmentId)
        .maybeSingle();

      const { data: doctorRows } = await supabase
        .from('doctors')
        .select('id,name,specialty,fee,department_id,active')
        .eq('department_id', departmentId)
        .eq('active', true)
        .order('name', { ascending: true });

      if (cancelled) return;
      setDepartment((deptRow ?? null) as Department | null);
      setDoctors((doctorRows ?? []) as Doctor[]);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading doctors…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[#0f172a] px-4 py-6">
        <div className="mx-auto max-w-6xl flex items-start justify-between gap-4">
          <div>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 px-2">
              <Link to="/hospital">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Link>
            </Button>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {department?.name ?? 'Department'}
            </h1>
            <p className="mt-1 text-sm text-slate-300">Select a doctor to book an appointment</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {doctors.length} available
          </Badge>
        </div>
      </header>

      <main className="bg-[#f8fafc]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          {doctors.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-muted-foreground">No doctors in this department.</CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {doctors.map((doc) => (
                <Card key={doc.id} className="border-0 shadow-sm hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-foreground">{doc.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{doc.specialty ?? 'Doctor'}</p>
                        {doc.fee != null ? (
                          <p className="text-sm text-muted-foreground mt-2">
                            Consultation fee: <span className="font-semibold text-foreground">₹ {doc.fee}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button asChild className="w-full font-semibold">
                      <Link to={`/book/${doc.id}`}>Book Appointment</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

