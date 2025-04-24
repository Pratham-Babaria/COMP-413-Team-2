import numpy as np
import pandas as pd
from itertools import product
import random

IMAGE_WIDTH = 256
IMAGE_HEIGHT = 128
GAZE_FREQUENCY = 10  # 10 samples per second

# Time intervals (in seconds)
patterns = ['border', 'center', 'all_around']
durations = [15, 75, 135]
# Example title/YOE combinations
titles = ['Other', 'Medical Student', 'Doctor', 'Nurse']
yoes = [0, 2, 5, 10, 15, 20]

def generate_gaze_points(pattern, n_points):
    if pattern == "border":
        points = []
        for _ in range(n_points):
            edge = random.choice(['top', 'bottom', 'left', 'right'])
            if edge == 'top':
                x = random.randint(0, IMAGE_WIDTH - 1)
                y = random.randint(0, 10)
            elif edge == 'bottom':
                x = random.randint(0, IMAGE_WIDTH - 1)
                y = random.randint(IMAGE_HEIGHT - 11, IMAGE_HEIGHT - 1)
            elif edge == 'left':
                x = random.randint(0, 10)
                y = random.randint(0, IMAGE_HEIGHT - 1)
            else:
                x = random.randint(IMAGE_WIDTH - 11, IMAGE_WIDTH - 1)
                y = random.randint(0, IMAGE_HEIGHT - 1)
            points.append((x, y))
    elif pattern == "center":
        center_x = IMAGE_WIDTH / 2
        center_y = IMAGE_HEIGHT / 2
        points = [
            (int(np.clip(np.random.normal(center_x, 10), 0, IMAGE_WIDTH - 1)),
             int(np.clip(np.random.normal(center_y, 10), 0, IMAGE_HEIGHT - 1)))
            for _ in range(n_points)
        ]
    else:  # all_around
        points = [(random.randint(0, IMAGE_WIDTH - 1), random.randint(0, IMAGE_HEIGHT - 1))
                  for _ in range(n_points)]
    return points

# Storage for aggregated simulation
rows = []

user_counter = 1
for (title, yoe, pattern, duration) in product(titles, yoes, patterns, durations):
    num_points = duration * GAZE_FREQUENCY
    gaze_points = generate_gaze_points(pattern, num_points)
    norm_xs = [x / IMAGE_WIDTH for x, y in gaze_points]
    norm_ys = [y / IMAGE_HEIGHT for x, y in gaze_points]

    in_center = [
        1 if 0.25 <= nx <= 0.75 and 0.25 <= ny <= 0.75 else 0
        for nx, ny in zip(norm_xs, norm_ys)
    ]

    grid_cells = set((int(nx * 10), int(ny * 10)) for nx, ny in zip(norm_xs, norm_ys))

    row = {
        'user_id': user_counter,
        'survey_id': 1,
        'num_gaze_points': num_points,
        'avg_gaze_x': np.mean(norm_xs),
        'avg_gaze_y': np.mean(norm_ys),
        'gaze_std_x': np.std(norm_xs),
        'gaze_std_y': np.std(norm_ys),
        'center_focus_ratio': np.mean(in_center),
        'perimeter_focus_ratio': 1 - np.mean(in_center),
        'unique_area_coverage': len(grid_cells) / 100,
        'total_view_time': duration,
        'years_of_experience': yoe,
        'title': title
    }

    rows.append(row)
    user_counter += 1

final_df = pd.DataFrame(rows)
labels = {
    'Novice': 0,
    'Expert': 1
}
def assign_label(row):
    title = row['title'].lower()
    yoe = row['years_of_experience']
    time = row['total_view_time']
    perimeter = row['perimeter_focus_ratio']

    if 'doctor' in title:
        if time == 135 and yoe < 3 and perimeter > 0.5:
            return labels["Novice"]
        return labels["Expert"]

    elif 'nurse' in title:
        if time == 135 and yoe < 3 and perimeter > 0.5:
            return labels["Novice"]
        return labels["Expert"]

    elif 'student' in title:
        if (yoe < 3 and perimeter > 0.5) or yoe == 0:
            return labels["Novice"]
        return labels["Expert"]

    else:
        if time < 135 and yoe > 5:
            return labels["Expert"]
        return labels["Novice"]

final_df["label"] = final_df.apply(assign_label, axis=1)
print(final_df[["title", "years_of_experience", "total_view_time", "perimeter_focus_ratio", "label"]].head())
final_df.to_csv('./ML/training_data.csv')