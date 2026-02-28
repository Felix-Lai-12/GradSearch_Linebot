#!/bin/bash
# Script to redact user IDs from existing GitHub issues

echo "⚠️  This script will edit existing issues to remove exposed user IDs"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

for issue_num in 1 2 3 4; do
    echo "Processing issue #$issue_num..."
    
    # Get current body
    body=$(gh issue view $issue_num --json body -q .body)
    
    # Replace full user ID with masked version
    new_body=$(echo "$body" | sed -E 's/\*\*用戶 ID\*\*: `U[0-9a-f]{32}`/**用戶 ID**: `***[已遮罩保護隱私]`/')
    
    # Update issue
    gh issue edit $issue_num --body "$new_body"
    
    echo "✅ Issue #$issue_num updated"
done

echo ""
echo "✅ All issues have been redacted"
