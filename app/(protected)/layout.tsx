import { Navbar } from "./_components/navbar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return ( 
    <div className="flex h-full flex-col items-center gap-y-10 justify-center bg-gradient-to-b from-purple-600 via-indigo-600 to-blue-800">
    <Navbar />
      {children}
    </div>
   );
}
 
export default ProtectedLayout;