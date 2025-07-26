import { supabase } from "@/integrations/supabase/client";
import { SchemaAdapter } from "./SchemaAdapter";

/**
 * Centralized test data management
 * Handles creation and cleanup of test data using the new schema
 */
export class TestDataManager {
  private static readonly DEFAULT_ORG_ID = 'b8f1c2e0-4b3a-4d5f-8c7e-9d0a1b2c3d4e';
  
  private createdData: {
    organizations?: string[];
    buildings?: string[];
    contractors?: string[];
    service_categories?: string[];
    service_requests?: string[];
    service_communications?: string[];
    service_attachments?: string[];
  } = {};

  /**
   * Ensures required test data exists
   */
  async ensureTestData() {
    const orgId = TestDataManager.DEFAULT_ORG_ID;
    
    // Ensure organization exists
    const { data: orgExists } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single();

    if (!orgExists) {
      await supabase
        .from('organizations')
        .insert({
          id: orgId,
          name: 'Test Organization',
          slug: 'test-org',
          email: 'test@example.com'
        });
    }

    // Get or create building
    let { data: buildings } = await supabase
      .from('buildings')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .limit(1);

    let buildingId: string;
    if (!buildings?.length) {
      const { data: newBuilding } = await supabase
        .from('buildings')
        .insert({
          organization_id: orgId,
          name: 'Test Building',
          address: 'Test Address, 123',
          is_active: true
        })
        .select('id')
        .single();
      
      buildingId = newBuilding!.id;
      this.createdData.buildings = [buildingId];
    } else {
      buildingId = buildings[0].id;
    }

    // Get or create contractor
    let { data: contractors } = await supabase
      .from('contractors')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .limit(1);

    let contractorId: string;
    if (!contractors?.length) {
      const { data: newContractor } = await supabase
        .from('contractors')
        .insert({
          organization_id: orgId,
          name: 'Test Contractor',
          email: 'contractor@test.com',
          phone: '+351 123 456 789',
          is_active: true
        })
        .select('id')
        .single();
      
      contractorId = newContractor!.id;
      this.createdData.contractors = [contractorId];
    } else {
      contractorId = contractors[0].id;
    }

    // Get or create service category
    let { data: categories } = await supabase
      .from('service_categories')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .limit(1);

    let categoryId: string;
    if (!categories?.length) {
      const { data: newCategory } = await supabase
        .from('service_categories')
        .insert({
          organization_id: orgId,
          name: 'Test Category',
          description: 'Test category for automated testing',
          is_active: true
        })
        .select('id')
        .single();
      
      categoryId = newCategory!.id;
      this.createdData.service_categories = [categoryId];
    } else {
      categoryId = categories[0].id;
    }

    return {
      organizationId: orgId,
      buildingId,
      contractorId,
      categoryId
    };
  }

  /**
   * Creates a test service request
   */
  async createTestServiceRequest(title: string = 'Test Service Request') {
    const { organizationId, buildingId, contractorId, categoryId } = await this.ensureTestData();

    const { data: serviceRequest, error } = await supabase
      .from('service_requests')
      .insert({
        organization_id: organizationId,
        building_id: buildingId,
        contractor_id: contractorId,
        category_id: categoryId,
        title,
        description: 'Automated test service request',
        request_number: `TEST-${Date.now()}`,
        access_token: this.generateTestToken(),
        status: 'submitted',
        priority: 'normal'
      })
      .select('id')
      .single();

    if (error) throw error;

    if (!this.createdData.service_requests) {
      this.createdData.service_requests = [];
    }
    this.createdData.service_requests.push(serviceRequest.id);

    return serviceRequest.id;
  }

  /**
   * Creates a test message
   */
  async createTestMessage(serviceRequestId: string, message: string) {
    const { data, error } = await supabase
      .from('service_communications')
      .insert({
        service_request_id: serviceRequestId,
        message,
        message_type: 'comment',
        author_name: 'Test User',
        author_role: 'admin'
      })
      .select('id')
      .single();

    if (error) throw error;

    if (!this.createdData.service_communications) {
      this.createdData.service_communications = [];
    }
    this.createdData.service_communications.push(data.id);

    return data.id;
  }

  /**
   * Creates a test attachment
   */
  async createTestAttachment(serviceRequestId: string, category: string = 'before') {
    const { data, error } = await supabase
      .from('service_attachments')
      .insert({
        service_request_id: serviceRequestId,
        file_name: 'test-photo.jpg',
        file_path: '/test/test-photo.jpg',
        file_type: 'photo',
        mime_type: 'image/jpeg',
        attachment_type: 'photo',
        category,
        uploaded_by: 'test-user',
        uploaded_role: 'admin'
      })
      .select('id')
      .single();

    if (error) throw error;

    if (!this.createdData.service_attachments) {
      this.createdData.service_attachments = [];
    }
    this.createdData.service_attachments.push(data.id);

    return data.id;
  }

  /**
   * Generates a test token
   */
  generateTestToken(): string {
    return `TEST_${Math.random().toString(36).substring(2, 18).toUpperCase()}`;
  }

  /**
   * Cleans up all created test data
   */
  async cleanup() {
    try {
      // Delete in reverse order of dependencies
      if (this.createdData.service_attachments?.length) {
        await supabase
          .from('service_attachments')
          .delete()
          .in('id', this.createdData.service_attachments);
      }

      if (this.createdData.service_communications?.length) {
        await supabase
          .from('service_communications')
          .delete()
          .in('id', this.createdData.service_communications);
      }

      if (this.createdData.service_requests?.length) {
        await supabase
          .from('service_requests')
          .delete()
          .in('id', this.createdData.service_requests);
      }

      if (this.createdData.service_categories?.length) {
        await supabase
          .from('service_categories')
          .delete()
          .in('id', this.createdData.service_categories);
      }

      if (this.createdData.contractors?.length) {
        await supabase
          .from('contractors')
          .delete()
          .in('id', this.createdData.contractors);
      }

      if (this.createdData.buildings?.length) {
        await supabase
          .from('buildings')
          .delete()
          .in('id', this.createdData.buildings);
      }

      // Reset tracking
      this.createdData = {};
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}