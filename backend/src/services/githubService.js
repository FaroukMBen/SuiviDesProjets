const axios = require('axios');

class GitHubService {
  constructor(token = null) {
    this.token = token;
    const headers = {
      Accept: 'application/vnd.github.v3+json'
    };
    if (token) {
      headers.Authorization = `token ${token}`;
    }
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers
    });
  }

  static parseRepositoryUrl(url) {
    if (!url) return null;
    const regex = /github\.com\/([^/]+)\/([^/.]+)/;
    const match = url.match(regex);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    return null;
  }

  // Récupérer TOUS les commits d'une branche (auto-pagination robuste)
  async getRepositoryCommits(owner, repo, branch = null, page = 1, perPage = 100) {
    const allCommits = [];
    let currentPage = page;
    while (true) {
      try {
        const params = { per_page: perPage, page: currentPage };
        if (branch) params.sha = branch;
        console.log(`[GitHub] Fetching commits page ${currentPage} for ${owner}/${repo}${branch ? ` (branch: ${branch})` : ''}`);
        const response = await this.client.get(`/repos/${owner}/${repo}/commits`, { params });
        const data = response.data;
        if (!data || data.length === 0) break;
        allCommits.push(...data);
        console.log(`[GitHub] Page ${currentPage}: ${data.length} commits (total so far: ${allCommits.length})`);
        // Si on a reçu moins que perPage, c'est la dernière page
        if (data.length < perPage) break;
        currentPage++;
      } catch (err) {
        // Si rate limit (403), propager l'erreur avec l'objet response intact
        if (err.response && err.response.status === 403) {
          console.warn(`[GitHub] Rate limit hit on page ${currentPage}. Returning ${allCommits.length} commits collected so far.`);
          if (allCommits.length > 0) return allCommits;
          throw err; // Propager l'erreur originale (pas un new Error) pour garder .response
        }
        // Pour les autres erreurs, retourner ce qu'on a déjà si possible
        console.warn(`[GitHub] Error on page ${currentPage}: ${err.message}. Returning ${allCommits.length} commits collected so far.`);
        if (allCommits.length > 0) return allCommits;
        throw err;
      }
    }
    console.log(`[GitHub] Total commits fetched for ${branch || 'default'}: ${allCommits.length}`);
    return allCommits;
  }

  // Récupérer le détail d'un commit (avec stats additions/deletions et fichiers)
  async getCommitDetail(owner, repo, sha) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/commits/${sha}`);
      return response.data;
    } catch (err) {
      throw new Error(`Failed to fetch commit detail: ${err.message}`);
    }
  }

  // Récupérer les branches du repo
  async getRepositoryBranches(owner, repo) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/branches`, {
        params: { per_page: 100 }
      });
      return response.data;
    } catch (err) {
      throw new Error(`Failed to fetch branches: ${err.message}`);
    }
  }

  async getRepositoryStats(owner, repo) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}`);
      return {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        url: response.data.html_url,
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
        watchers: response.data.watchers_count,
        language: response.data.language,
        topics: response.data.topics,
        defaultBranch: response.data.default_branch
      };
    } catch (err) {
      throw new Error(`Failed to fetch repo stats: ${err.message}`);
    }
  }

  async getUserProfile(username) {
    try {
      const response = await this.client.get(`/users/${username}`);
      return {
        login: response.data.login,
        name: response.data.name,
        avatar_url: response.data.avatar_url,
        bio: response.data.bio,
        public_repos: response.data.public_repos,
        followers: response.data.followers,
        following: response.data.following
      };
    } catch (err) {
      throw new Error(`Failed to fetch user profile: ${err.message}`);
    }
  }

  async getRepositoryLanguages(owner, repo) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/languages`);
      return response.data;
    } catch (err) {
      throw new Error(`Failed to fetch languages: ${err.message}`);
    }
  }

  async getRepositoryCollaborators(owner, repo) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/collaborators`);
      return response.data.map(collab => ({
        login: collab.login,
        avatar_url: collab.avatar_url,
        contributions: collab.contributions
      }));
    } catch (err) {
      throw new Error(`Failed to fetch collaborators: ${err.message}`);
    }
  }
}

module.exports = GitHubService;
