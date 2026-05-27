
def calculate_timeinput_score(): #add in autofill from scheduler later
        print("Enter time input in hours:")
        timeinput = float(input())
        if timeinput <= 3:
            return 1
        elif timeinput == 4:
            return 2
        elif timeinput == 5:
            return 3
        elif timeinput == 6:
            return 4
        elif timeinput == 7 or timeinput == 8:
            return 5
        elif timeinput == 9 or timeinput == 10:
            return 6
        elif timeinput == 11 or timeinput == 12:
            return 7
        elif timeinput >= 13 and timeinput <=15:
            return 8
        elif timeinput >= 16 and timeinput <=20:
            return 9
        elif timeinput > 20:
            return 10
        else:
            return 5

def calculate():
        """Calculate the ready score for a task based on its attributes and the attributes of the subjects it belongs to"""
        days_left_score = float(input("Enter days left score: "))
        priority_level = float(input("Enter priority level: "))
        subject_difficulty = float(input("Enter subject difficulty: "))
        subject_cumulative_score = float(input("Enter subject cumulative score: "))*0.1
        timeinput_score = calculate_timeinput_score()
        ready_score = (priority_level + subject_difficulty + days_left_score*0.5 + timeinput_score*0.5 + subject_cumulative_score) / 40 * 100
        print(f"Ready Score: {ready_score}")

calculate()