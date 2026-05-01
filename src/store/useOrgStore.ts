import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, onSnapshot, query, where, arrayUnion } from 'firebase/firestore';
import { Organization, OrgMember } from '@/types/organization';

interface OrgStore {
  organizations: Organization[];
  currentOrgId: string | null;
  isLoading: boolean;
  initializeOrgs: (userId: string) => () => void;
  setCurrentOrgId: (id: string | null) => void;
  createOrganization: (name: string, userId: string) => Promise<string>;
  joinOrganization: (orgId: string, userId: string) => Promise<void>;
}

export const useOrgStore = create<OrgStore>((set, get) => ({
  organizations: [],
  currentOrgId: null,
  isLoading: true,

  initializeOrgs: (userId: string) => {
    set({ isLoading: true });
    
    // members配列内のuserIdが存在する組織を取得（Firebaseではオブジェクト配列の検索は難しいため、通常は別フィールドにUIDリストを持つか、サブコレクションにするが、今回は簡易的に ownerId か、別途UIDリストを持たせる運用にする必要がある。しかしここはZustand内でフロントエンドフィルタするか、データ構造を調整する）
    // Firestoreでのクエリの制限を避けるため、membersUidListというstring配列を持たせることにする
    const q = query(
      collection(db, 'organizations'),
      where('membersUidList', 'array-contains', userId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orgs: Organization[] = [];
      snapshot.forEach((doc) => {
        orgs.push(doc.data() as Organization);
      });
      
      // デフォルトの組織を選択
      const currentOrgId = get().currentOrgId;
      if (!currentOrgId && orgs.length > 0) {
        set({ currentOrgId: orgs[0].id });
      }
      
      set({ organizations: orgs, isLoading: false });
    });

    return unsubscribe;
  },

  setCurrentOrgId: (id) => set({ currentOrgId: id }),

  createOrganization: async (name, userId) => {
    const newOrgId = Math.random().toString(36).substr(2, 9);
    
    const newMember: OrgMember = {
      userId,
      role: 'admin',
      joinedAt: Date.now(),
    };

    const newOrg = {
      id: newOrgId,
      name,
      ownerId: userId,
      members: [newMember],
      membersUidList: [userId], // クエリ用のUID配列
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'organizations', newOrgId), newOrg);
    set({ currentOrgId: newOrgId });
    return newOrgId;
  },

  joinOrganization: async (orgId: string, userId: string) => {
    try {
      const newMember: OrgMember = {
        userId,
        role: 'viewer', // デフォルトはviewer
        joinedAt: Date.now(),
      };
      
      const orgRef = doc(db, 'organizations', orgId);
      
      // 注意: arrayUnionを使ってオブジェクトを追加するのは値が完全一致する場合のみ機能するが、新規追加なら問題ない。
      // もし重複チェック等を厳密にするなら、一度getDocして確認する必要がある。今回は簡略化。
      // また、membersUidListも同時に更新する。
      
      const docSnap = await getDoc(orgRef);
      if (!docSnap.exists()) throw new Error("Organization not found");
      
      const orgData = docSnap.data() as Organization;
      const isAlreadyMember = orgData.membersUidList?.includes(userId);
      
      if (!isAlreadyMember) {
        // FIXME: importに updateDoc 等を追加する必要があるが、ここは既存のsetDocを使うか、updateDocを使う
        // useProjectStoreのように上部にupdateDocをインポートしたはずだが、無ければsetDoc(..., {merge: true})で代用
        await setDoc(orgRef, {
          members: arrayUnion(newMember),
          membersUidList: arrayUnion(userId)
        }, { merge: true });
      }
      
      set({ currentOrgId: orgId });
    } catch (error) {
      console.error("Error joining organization:", error);
      throw error;
    }
  }
}));
