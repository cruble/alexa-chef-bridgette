
menu = {"id":26,"day_date":"2016-11-14","name":null,"theme":null,"created_at":"2016-11-14T18:12:11.992Z","updated_at":"2016-11-14T18:12:11.992Z","soups":[{"id":11,"menu_id":26,"name":"Celery Root \u0026 Green Apple Soup","created_at":"2016-11-14T18:12:12.821Z","updated_at":"2016-11-14T18:12:12.821Z"}, {"id":11,"menu_id":26,"name":"Celery Root \u0026 Green Apple Soup","created_at":"2016-11-14T18:12:12.821Z","updated_at":"2016-11-14T18:12:12.821Z"}],"entrees":[{"id":17,"menu_id":26,"name":"Beef -a- Roni with Parmesan Cheese","created_at":"2016-11-14T18:12:12.841Z","updated_at":"2016-11-14T18:12:12.841Z"}, {"id":17,"menu_id":26,"name":"Beef -a- Roni with Parmesan Cheese","created_at":"2016-11-14T18:12:12.841Z","updated_at":"2016-11-14T18:12:12.841Z"}],"sides":[{"id":29,"menu_id":26,"name":"Sauteed Rainbow Swiss Chard with Shallots","created_at":"2016-11-14T18:12:12.859Z","updated_at":"2016-11-14T18:12:12.859Z"},{"id":30,"menu_id":26,"name":"Steamed Broccoli with Green Olives","created_at":"2016-11-14T18:12:12.864Z","updated_at":"2016-11-14T18:12:12.864Z"}],"vegans":[{"id":12,"menu_id":26,"name":"Wild Rice with White Beans, Tomatoes \u0026 Basil","created_at":"2016-11-14T18:12:12.880Z","updated_at":"2016-11-14T18:12:12.880Z"}, {"id":12,"menu_id":26,"name":"Wild Rice with White Beans, Tomatoes \u0026 Basil","created_at":"2016-11-14T18:12:12.880Z","updated_at":"2016-11-14T18:12:12.880Z"}]}

function assembleMenu(menuResponseObj) {

    var s, e, sd, v; 
    var all_string = ""; 
    var soup_string = "";
    var entree_string = "";
    var side_string = "";
    var vegan_string = ""; 


    if (menuResponseObj.soups[0].name) {
        if (menuResponseObj.soups.length > 1) {
            soup_string = "The soups are "
            for (var i = 0; i < menuResponseObj.soups.length; i++) {
              soup_string += menuResponseObj.soups[i].name;
              soup_string += " ";
              if (i == menuResponseObj.soups.length - 2) {
                soup_string += "and ";
              }
            };
        soup_string += ". ";
        } else {
            soup_string = "The soup is " + menuResponseObj.soups[0].name + ". "; 
        }
    } 

    if (menuResponseObj.entrees[0].name) {
        if (menuResponseObj.entrees.length > 1) {
            entree_string = "The entrees are "
            for (var i = 0; i < menuResponseObj.entrees.length; i++) {
              entree_string += menuResponseObj.entrees[i].name;
              entree_string += " ";
              if (i == menuResponseObj.entrees.length - 2) {
                entree_string += "and ";
              };
            } 
        entree_string += ". ";
        } else {
            entree_string = "The entree is " + menuResponseObj.entrees[0].name + ". "; 
        }
    } 

    if (menuResponseObj.sides[0].name) {
        if (menuResponseObj.sides.length > 1) {
            side_string = "The sides are "
            for (var i = 0; i < menuResponseObj.sides.length; i++) {
              side_string += menuResponseObj.sides[i].name;
              side_string += " ";
              if (i == menuResponseObj.sides.length - 2) {
                side_string += "and ";
              }
            };
            side_string += ". ";
        } else {
            side_string = "The side is " + menuResponseObj.sides[0].name + ". "; 
        }
    } 

    if (menuResponseObj.vegans[0].name) {
        if (menuResponseObj.vegans.length > 1) {
            vegan_string = "The vegan options are "
            for (var i = 0; i < menuResponseObj.vegans.length; i++) {
              vegan_string += menuResponseObj.vegans[i].name;
              vegan_string += " ";
              if (i == menuResponseObj.vegans.length - 2) {
                vegan_string += "and ";
              }
            };
            vegan_string += ". ";
        } else {
            vegan_string = "The vegan option is " + menuResponseObj.vegans[0].name + ". "; 
        }
    } 

    all_string = soup_string + " " + entree_string + " " + side_string + " " + vegan_string; 


    return {
        soup: soup_string, entree: entree_string, side: side_string, vegan: vegan_string, all: all_string
    }
}




