export const members = [
  { id: "1", name: "Rajesh Sharma", role: "President", email: "rajesh@club.org", phone: "+91 98765 43210", joined: "2020-01-15", avatar: "", status: "active" },
  { id: "2", name: "Priya Patel", role: "Secretary", email: "priya@club.org", phone: "+91 87654 32109", joined: "2020-03-20", avatar: "", status: "active" },
  { id: "3", name: "Amit Kumar", role: "Treasurer", email: "amit@club.org", phone: "+91 76543 21098", joined: "2021-06-10", avatar: "", status: "active" },
  { id: "4", name: "Sneha Gupta", role: "Member", email: "sneha@club.org", phone: "+91 65432 10987", joined: "2021-09-05", avatar: "", status: "active" },
  { id: "5", name: "Vikram Singh", role: "Member", email: "vikram@club.org", phone: "+91 54321 09876", joined: "2022-01-12", avatar: "", status: "inactive" },
  { id: "6", name: "Anita Desai", role: "Vice President", email: "anita@club.org", phone: "+91 43210 98765", joined: "2020-02-28", avatar: "", status: "active" },
  { id: "7", name: "Karan Mehta", role: "Member", email: "karan@club.org", phone: "+91 32109 87654", joined: "2023-04-18", avatar: "", status: "active" },
  { id: "8", name: "Deepa Nair", role: "Member", email: "deepa@club.org", phone: "+91 21098 76543", joined: "2023-07-22", avatar: "", status: "active" },
];

export const events = [
  { id: "1", title: "Annual Gala Night", date: "2026-04-15", time: "7:00 PM", location: "Grand Ballroom, Hotel Imperial", description: "Join us for an evening of celebration and networking.", attendees: 120, category: "Social" },
  { id: "2", title: "Community Service Drive", date: "2026-04-22", time: "9:00 AM", location: "City Community Center", description: "Tree plantation and neighborhood cleanup.", attendees: 45, category: "Service" },
  { id: "3", title: "Leadership Workshop", date: "2026-05-05", time: "10:00 AM", location: "Club Conference Room", description: "Workshop on effective leadership skills.", attendees: 30, category: "Education" },
  { id: "4", title: "Charity Run 2026", date: "2026-05-20", time: "6:00 AM", location: "Central Park", description: "5K charity run for underprivileged children.", attendees: 200, category: "Fundraising" },
  { id: "5", title: "Monthly General Meeting", date: "2026-04-10", time: "6:30 PM", location: "Club House", description: "Regular monthly meeting with agenda.", attendees: 60, category: "Meeting" },
];

export const announcements = [
  { id: "1", title: "Membership Renewal Deadline", content: "Please renew your membership by April 30th to continue enjoying benefits.", date: "2026-03-20", author: "Rajesh Sharma", priority: "high" },
  { id: "2", title: "New Committee Formed", content: "A new youth engagement committee has been formed. Interested members can register.", date: "2026-03-18", author: "Priya Patel", priority: "medium" },
  { id: "3", title: "Website Redesign Launch", content: "Our new club website is now live! Explore the updated features.", date: "2026-03-15", author: "Amit Kumar", priority: "low" },
  { id: "4", title: "Annual Report Available", content: "The 2025 annual report is now available for download in the resources section.", date: "2026-03-10", author: "Anita Desai", priority: "medium" },
];

export const tasks = [
  { id: "1", title: "Prepare event budget", assignee: "Amit Kumar", status: "completed", dueDate: "2026-03-25", priority: "high" },
  { id: "2", title: "Design event posters", assignee: "Sneha Gupta", status: "in-progress", dueDate: "2026-04-01", priority: "medium" },
  { id: "3", title: "Send invitation emails", assignee: "Priya Patel", status: "pending", dueDate: "2026-04-05", priority: "high" },
  { id: "4", title: "Arrange catering", assignee: "Karan Mehta", status: "pending", dueDate: "2026-04-10", priority: "medium" },
  { id: "5", title: "Book venue", assignee: "Rajesh Sharma", status: "completed", dueDate: "2026-03-20", priority: "high" },
  { id: "6", title: "Prepare presentation", assignee: "Deepa Nair", status: "in-progress", dueDate: "2026-04-08", priority: "low" },
];

export const finances = [
  { id: "1", description: "Membership fees collected", type: "income" as const, amount: 150000, date: "2026-03-01", category: "Membership" },
  { id: "2", description: "Venue booking - Gala Night", type: "expense" as const, amount: 45000, date: "2026-03-05", category: "Events" },
  { id: "3", description: "Sponsorship - TechCorp", type: "income" as const, amount: 75000, date: "2026-03-10", category: "Sponsorship" },
  { id: "4", description: "Catering advance", type: "expense" as const, amount: 20000, date: "2026-03-12", category: "Events" },
  { id: "5", description: "Printing & Stationery", type: "expense" as const, amount: 8000, date: "2026-03-15", category: "Admin" },
  { id: "6", description: "Donation received", type: "income" as const, amount: 50000, date: "2026-03-18", category: "Donations" },
];

export const payments = [
  { id: "1", member: "Rajesh Sharma", amount: 5000, date: "2026-01-05", status: "paid" as const, type: "Annual Fee" },
  { id: "2", member: "Priya Patel", amount: 5000, date: "2026-01-10", status: "paid" as const, type: "Annual Fee" },
  { id: "3", member: "Vikram Singh", amount: 5000, date: "", status: "unpaid" as const, type: "Annual Fee" },
  { id: "4", member: "Sneha Gupta", amount: 2000, date: "2026-02-15", status: "paid" as const, type: "Event Fee" },
  { id: "5", member: "Karan Mehta", amount: 5000, date: "", status: "unpaid" as const, type: "Annual Fee" },
  { id: "6", member: "Amit Kumar", amount: 5000, date: "2026-01-08", status: "paid" as const, type: "Annual Fee" },
];

export const polls = [
  { id: "1", question: "Preferred venue for Annual Gala?", options: [{ text: "Hotel Imperial", votes: 35 }, { text: "Club House", votes: 22 }, { text: "Convention Center", votes: 18 }], status: "active" as const, endDate: "2026-04-05" },
  { id: "2", question: "Best day for weekly meetings?", options: [{ text: "Monday", votes: 15 }, { text: "Wednesday", votes: 28 }, { text: "Friday", votes: 20 }], status: "closed" as const, endDate: "2026-03-20" },
  { id: "3", question: "Next community service project?", options: [{ text: "Blood Donation", votes: 40 }, { text: "Tree Plantation", votes: 32 }, { text: "Education Drive", votes: 25 }], status: "active" as const, endDate: "2026-04-15" },
];

export const referrals = [
  { id: "1", referrer: "Rajesh Sharma", referred: "Suresh Verma", date: "2026-02-10", status: "accepted" },
  { id: "2", referrer: "Priya Patel", referred: "Meera Joshi", date: "2026-02-20", status: "pending" },
  { id: "3", referrer: "Amit Kumar", referred: "Ravi Khanna", date: "2026-03-01", status: "accepted" },
  { id: "4", referrer: "Sneha Gupta", referred: "Pooja Reddy", date: "2026-03-10", status: "pending" },
];

export const attendance = [
  { eventId: "5", eventTitle: "Monthly General Meeting", date: "2026-04-10", present: ["1", "2", "3", "4", "6", "7"], absent: ["5", "8"], total: 8 },
  { eventId: "2", eventTitle: "Community Service Drive", date: "2026-03-22", present: ["1", "2", "4", "6", "8"], absent: ["3", "5", "7"], total: 8 },
];

export const monthlyStats = [
  { month: "Oct", members: 52, events: 3, revenue: 45000 },
  { month: "Nov", members: 55, events: 4, revenue: 62000 },
  { month: "Dec", members: 58, events: 5, revenue: 85000 },
  { month: "Jan", members: 60, events: 3, revenue: 55000 },
  { month: "Feb", members: 63, events: 4, revenue: 72000 },
  { month: "Mar", members: 65, events: 6, revenue: 95000 },
];
