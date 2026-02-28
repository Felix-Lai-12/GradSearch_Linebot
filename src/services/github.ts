export async function createGitHubIssue(
    type: 'feature' | 'bug',
    content: string,
    userId: string
): Promise<boolean> {
    const token = process.env.GH_ISSUES_TOKEN;
    if (!token) {
        console.error('GH_ISSUES_TOKEN not set');
        return false;
    }

    const title = type === 'bug'
        ? `[用戶回報] ${content.substring(0, 50)}`
        : `[用戶許願] ${content.substring(0, 50)}`;

    const body = `**用戶 ID**: \`${userId}\`\n**類型**: ${type === 'bug' ? 'Bug 回報' : '功能許願'}\n\n**內容**:\n${content}`;

    const labels = type === 'bug' ? ['bug', 'user-report'] : ['enhancement', 'user-request'];

    try {
        const response = await fetch('https://api.github.com/repos/Felix-Lai-12/GradSearch_Linebot/issues', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, body, labels }),
        });

        if (!response.ok) {
            console.error('Failed to create issue:', await response.text());
            return false;
        }

        const issue = await response.json() as { number: number, html_url: string };
        console.log(`Created issue #${issue.number}: ${issue.html_url}`);
        return true;
    } catch (error) {
        console.error('Error creating GitHub issue:', error);
        return false;
    }
}
