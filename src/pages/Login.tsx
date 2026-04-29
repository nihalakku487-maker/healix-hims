import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "framer-motion";
import { Stethoscope, Building, Lock, ArrowLeft } from "lucide-react";
import { MediQMark } from "@/components/MediQLogo";
import { toast } from "sonner";

// All staff credentials
const STAFF_CREDS: Record<string, { role: "doctor" | "receptionist"; password: string; doctorId?: string }> = {
  "dr.ananya":  { role: "doctor",       password: "sastha123", doctorId: "doc1" },
  "dr.ramesh":  { role: "doctor",       password: "sastha123", doctorId: "doc2" },
  "dr.arjun":   { role: "doctor",       password: "sastha123", doctorId: "doc3" },
  "reception":  { role: "receptionist", password: "sastha123" },
};

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"doctor" | "receptionist">("doctor");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cred = STAFF_CREDS[username.trim().toLowerCase()];
    const isValid = cred && cred.password === password && cred.role === role;

    if (isValid) {
      localStorage.setItem("mediq_auth", role);
      if (cred.doctorId) localStorage.setItem("mediq_doctor_id", cred.doctorId);
      else localStorage.removeItem("mediq_doctor_id");
      toast.success("Login Successful");
      
      setTimeout(() => {
        if (role === "doctor") navigate("/doctor");
        else navigate("/clinic");
      }, 100);
    } else {
      toast.error("Incorrect Credentials", {
        description: role === "doctor"
          ? "Doctors: dr.ananya / dr.ramesh / dr.arjun — all use password: sastha123"
          : "Receptionist: reception / sastha123"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-200 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-teal-100 blur-3xl opacity-60"></div>
      <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] rounded-full bg-blue-100 blur-3xl opacity-60"></div>
      
      <header className="p-6 relative z-10">
         <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-600 hover:bg-slate-200/50">
            <ArrowLeft className="mr-2" size={18} /> Back to Home
         </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md"
        >
           <Card className="p-8 border border-white/60 bg-white/70 backdrop-blur-xl shadow-2xl rounded-[2.5rem]">
             <div className="flex flex-col items-center mb-8">
               <div className="mb-4">
                 <MediQMark size={64} />
               </div>
               <h1 className="text-2xl font-black text-slate-800 tracking-tight">Provider Portal</h1>
               <p className="text-slate-500 font-medium text-sm text-center mt-2">Secure access for Doctors and Receptionists.</p>
             </div>

             <form onSubmit={handleLogin} className="space-y-8">
               
               <div>
                  <Label className="text-slate-600 font-bold mb-3 block">Select your role</Label>
                  <RadioGroup defaultValue="doctor" onValueChange={(val: any) => setRole(val)} className="grid grid-cols-2 gap-4">
                    <div>
                      <RadioGroupItem value="doctor" id="doctor" className="peer sr-only" />
                      <Label
                        htmlFor="doctor"
                        className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:bg-teal-50 peer-data-[state=checked]:text-teal-900 cursor-pointer transition-all"
                      >
                        <Stethoscope className="mb-2 h-6 w-6" />
                        <span className="font-bold text-sm">Doctor</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="receptionist" id="receptionist" className="peer sr-only" />
                      <Label
                        htmlFor="receptionist"
                        className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:text-blue-900 cursor-pointer transition-all"
                      >
                        <Building className="mb-2 h-6 w-6" />
                        <span className="font-bold text-sm">Receptionist</span>
                      </Label>
                    </div>
                  </RadioGroup>
               </div>

               <div className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-slate-600 font-bold">Username</Label>
                    <div className="relative mt-2">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Stethoscope className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input 
                        id="username" 
                        type="text" 
                        required 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      placeholder={role === 'doctor' ? "e.g. dr.ananya, dr.ramesh, dr.arjun" : "e.g. reception"}
                        className="pl-11 h-14 rounded-xl bg-white border-slate-200 focus-visible:ring-teal-500 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-slate-600 font-bold">Facility Password</Label>
                    <div className="relative mt-2">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter access code..." 
                        className="pl-11 h-14 rounded-xl bg-white border-slate-200 focus-visible:ring-teal-500 shadow-sm"
                      />
                    </div>
                  </div>
               </div>

               <Button type="submit" className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg font-bold text-lg">
                 Secure Login
               </Button>
               
             </form>
           </Card>
        </motion.div>
      </main>
    </div>
  );
}
