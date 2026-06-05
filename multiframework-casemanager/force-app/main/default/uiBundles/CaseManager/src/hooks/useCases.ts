import { useState, useEffect, useCallback } from 'react';
import { executeGraphQL } from '@/api/graphqlClient';
import type {
  GetCasesQuery,
  GetCasesQueryVariables,
  CreateCaseMutation,
  CreateCaseMutationVariables,
  UpdateCaseMutation,
  UpdateCaseMutationVariables,
  DeleteCaseMutation,
  DeleteCaseMutationVariables,
} from '@/api/graphql-operations-types';
import getCasesQuery from '@/api/queries/getCases.graphql?raw';
import createCaseMutation from '@/api/mutations/createCase.graphql?raw';
import updateCaseMutation from '@/api/mutations/updateCase.graphql?raw';
import deleteCaseMutation from '@/api/mutations/deleteCase.graphql?raw';

export type CaseNode = NonNullable<
  NonNullable<
    NonNullable<NonNullable<GetCasesQuery['uiapi']['query']['Case']>['edges']>[number]
  >['node']
>;

interface UseCasesResult {
  cases: CaseNode[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createCase: (subject: string, status: string, priority: string) => Promise<void>;
  updateCaseStatus: (id: string, newStatus: string) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
}

export function useCases(): UseCasesResult {
  const [cases, setCases] = useState<CaseNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCases = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await executeGraphQL<GetCasesQuery, GetCasesQueryVariables>(
        getCasesQuery,
      );
      const edges = result.uiapi.query.Case?.edges ?? [];
      setCases(edges.flatMap(edge => (edge?.node ? [edge.node] : [])));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const createCase = async (
    subject: string,
    status: string,
    priority: string,
  ): Promise<void> => {
    setError(null);
    try {
      await executeGraphQL<CreateCaseMutation, CreateCaseMutationVariables>(
        createCaseMutation,
        { subject, status, priority },
      );
      await fetchCases();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const updateCaseStatus = async (id: string, newStatus: string): Promise<void> => {
    setError(null);
    try {
      await executeGraphQL<UpdateCaseMutation, UpdateCaseMutationVariables>(
        updateCaseMutation,
        { id, status: newStatus },
      );
      await fetchCases();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const deleteCase = async (id: string): Promise<void> => {
    setError(null);
    try {
      await executeGraphQL<DeleteCaseMutation, DeleteCaseMutationVariables>(
        deleteCaseMutation,
        { id },
      );
      await fetchCases();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return {
    cases,
    isLoading,
    error,
    refetch: fetchCases,
    createCase,
    updateCaseStatus,
    deleteCase,
  };
}
