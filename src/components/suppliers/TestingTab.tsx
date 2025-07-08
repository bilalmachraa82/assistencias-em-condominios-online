
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EndToEndTester from '@/components/testing/EndToEndTester';
import SystemHealthCheck from '@/components/testing/SystemHealthCheck';
import PhotoUploadTester from '@/components/testing/PhotoUploadTester';
import ComprehensiveFlowTester from '@/components/testing/ComprehensiveFlowTester';
import EdgeFunctionDebugger from '@/components/testing/EdgeFunctionDebugger';

export default function TestingTab() {
  return (
    <Tabs defaultValue="comprehensive" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="comprehensive">Teste Completo</TabsTrigger>
        <TabsTrigger value="debug">Debug Edge Function</TabsTrigger>
        <TabsTrigger value="end-to-end">End-to-End</TabsTrigger>
        <TabsTrigger value="health-check">Verificação Sistema</TabsTrigger>
        <TabsTrigger value="photo-upload">Upload Fotos</TabsTrigger>
      </TabsList>
      
      <TabsContent value="comprehensive" className="mt-4">
        <ComprehensiveFlowTester />
      </TabsContent>
      
      <TabsContent value="debug" className="mt-4">
        <EdgeFunctionDebugger />
      </TabsContent>
      
      <TabsContent value="end-to-end" className="mt-4">
        <EndToEndTester />
      </TabsContent>
      
      <TabsContent value="health-check" className="mt-4">
        <SystemHealthCheck />
      </TabsContent>

      <TabsContent value="photo-upload" className="mt-4">
        <PhotoUploadTester />
      </TabsContent>
    </Tabs>
  );
}
