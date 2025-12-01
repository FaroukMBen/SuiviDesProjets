const axios = require('axios');

class GitHubService {
  constructor(token) {
    this.token = token;
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
  }

  async getRepositoryCommits(owner, repo, page = 1) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/commits`, {
        params: { per_page: 30, page }
      });
      return response.data;
    } catch (err) {
      throw new Error(`Failed to fetch commits: ${err.message}`);
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
        topics: response.data.topics
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
