
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EndToEndTester from '@/components/testing/EndToEndTester';
import SystemHealthCheck from '@/components/testing/SystemHealthCheck';

export default function TestingTab() {
  return (
    <Tabs defaultValue="end-to-end" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="end-to-end">Teste End-to-End</TabsTrigger>
        <TabsTrigger value="health-check">Verificação do Sistema</TabsTrigger>
      </TabsList>
      
      <TabsContent value="end-to-end" className="mt-4">
        <EndToEndTester />
      </TabsContent>
      
      <TabsContent value="health-check" className="mt-4">
        <SystemHealthCheck />
      </TabsContent>
    </Tabs>
  );
}
