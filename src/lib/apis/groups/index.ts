// Groups are not implemented in the Firebase backend — all functions are no-ops

export const createNewGroup = async (_token: string, _group: object) => null;

export const getGroups = async (_token: string = '', _share?: boolean) => [];

export const getGroupById = async (_token: string, _id: string) => null;

export const getGroupInfoById = async (_token: string, _id: string) => null;

export const updateGroupById = async (_token: string, _id: string, _group: object) => null;

export const deleteGroupById = async (_token: string, _id: string) => null;

export const addUserToGroup = async (_token: string, _id: string, _userIds: string[]) => null;

export const removeUserFromGroup = async (_token: string, _id: string, _userIds: string[]) => null;

export const getGroupPreview = async (_token: string, _id: string) => null;

export const getUserGroupsById = async (_token: string, _id: string) => [];
